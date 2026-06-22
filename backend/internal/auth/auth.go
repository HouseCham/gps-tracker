// Package auth wires the Authula authentication library into the API.
//
// Authula runs in embedded library mode inside the same process as the API.
// It owns its own Postgres-backed tables (users, sessions, accounts,
// jwt_keys, jwt_refresh_tokens, verifications) which live alongside our
// app tables in the same database. The integration is intentionally thin:
// we mount Authula's HTTP handler at /api/auth/* and consume two services
// from its registry (JWTService and UserService) to power our own Fiber
// middlewares, rather than letting Authula drive middleware on Fiber
// routes directly.
//
// Our own `users` table remains the source of truth for the local
// projection (role, name, lastname, FK relationships to devices/access
// grants). It is populated lazily on first authenticated request, with
// the link between an Authula user and our local user being the email
// address (already UNIQUE in our schema).
package auth

import (
	"context"
	"fmt"
	"net/http"
	"time"

	authula "github.com/Authula/authula"
	authulaconfig "github.com/Authula/authula/config"
	"github.com/Authula/authula/env"
	"github.com/Authula/authula/models"
	emailpasswordplugin "github.com/Authula/authula/plugins/email-password"
	emailpasswordplugintypes "github.com/Authula/authula/plugins/email-password/types"
	jwtplugin "github.com/Authula/authula/plugins/jwt"
	jwtplugintypes "github.com/Authula/authula/plugins/jwt/types"
	authulaservices "github.com/Authula/authula/services"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// BasePath is the URL prefix where Authula's own routes (sign-in,
// sign-up, JWKS, token refresh, etc.) are mounted. Mounted under the
// /api prefix to keep the surface area namespaced.
const BasePath = "/api/auth"

// Config carries the runtime configuration consumed by Bootstrap.
type Config struct {
	// AppName is shown in Authula logs and metadata. Defaults to
	// "gps-tracker-api" when empty.
	AppName string
	// BaseURL is the public origin of the API. Used by Authula to
	// build redirect/email links. Falls back to the AUTHULA_BASE_URL
	// environment variable, then to "http://localhost:8080".
	BaseURL string
	// Secret is the symmetric secret used to encrypt sensitive
	// fields at rest (e.g. JWT private keys). MUST be set; we fail
	// fast during Bootstrap if it is empty.
	Secret string
	// DatabaseURL is a postgres:// connection string. The same DB
	// used by the main app; Authula will create its own tables on
	// first init.
	DatabaseURL string
}

// Auth is the composition root for Authula. It exposes the bits of
// the Authula surface that the rest of the application needs.
type Auth struct {
	instance        *authula.Auth
	jwtService      authulaservices.JWTService
	userService     authulaservices.UserService
	accountService  authulaservices.AccountService
	passwordService authulaservices.PasswordService
}

// Bootstrap initializes Authula: it runs core + plugin migrations
// (idempotent) and registers the email-password and JWT plugins. The
// returned *Auth is safe to call Handler() / JWTValidator() /
// UserLookup() on for the rest of the process lifetime.
func Bootstrap(ctx context.Context, cfg Config) (*Auth, error) {
	if cfg.Secret == "" {
		return nil, fmt.Errorf("auth: AUTHULA_SECRET is required")
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("auth: DatabaseURL is required")
	}

	appName := cfg.AppName
	if appName == "" {
		appName = "gps-tracker-api"
	}

	// Make AUTHULA_DATABASE_URL visible to the internal bootstrap
	// step that opens the Bun connection. The WithDatabase option
	// falls back to it when no URL is provided directly to the
	// config, so we set it here to keep wiring in one place.
	if err := setEnvIfEmpty(env.EnvDatabaseURL, cfg.DatabaseURL); err != nil {
		return nil, fmt.Errorf("auth: failed to set %s: %w", env.EnvDatabaseURL, err)
	}

	authulaCfg := authulaconfig.NewConfig(
		authulaconfig.WithAppName(appName),
		authulaconfig.WithBaseURL(cfg.BaseURL),
		authulaconfig.WithBasePath(BasePath),
		authulaconfig.WithSecret(cfg.Secret),
		authulaconfig.WithDatabase(models.DatabaseConfig{
			Provider: "postgres",
			URL:      cfg.DatabaseURL,
		}),
		// Email verification is intentionally disabled for v1
		// (we have no SMTP wiring); it can be enabled later by
		// providing SendEmailVerification + an SMTP plugin.
		authulaconfig.WithPlugins(models.PluginsConfig{
			models.PluginEmailPassword.String(): &emailpasswordplugintypes.EmailPasswordPluginConfig{
				Enabled:   true,
				AutoSignIn: true,
			},
			models.PluginJWT.String(): &jwtplugintypes.JWTPluginConfig{
				Enabled:          true,
				ExpiresIn:        15 * time.Minute,
				RefreshExpiresIn: 7 * 24 * time.Hour,
			},
		}),
		// Make the email-password sign-in route also emit a JWT
		// pair in the JSON response (access + refresh). The
		// `issue_tokens` hook is global; the `respond_json` hook
		// is per-route, hence this mapping.
		authulaconfig.WithRouteMappings([]models.RouteMapping{
			{
				Paths:   []string{"POST:/email-password/sign-in"},
				Plugins: []string{"jwt.respond_json"},
			},
			{
				Paths:   []string{"POST:/email-password/sign-up"},
				Plugins: []string{"jwt.respond_json"},
			},
		}),
	)

	instance := authula.New(&authula.AuthConfig{
		Config: authulaCfg,
		Plugins: []models.Plugin{
			emailpasswordplugin.New(emailpasswordplugintypes.EmailPasswordPluginConfig{
				Enabled:   true,
				AutoSignIn: true,
			}),
			jwtplugin.New(jwtplugintypes.JWTPluginConfig{
				Enabled:          true,
				ExpiresIn:        15 * time.Minute,
				RefreshExpiresIn: 7 * 24 * time.Hour,
			}),
		},
	})

	// Pre-warm the handler so route registration + plugin init
	// happen eagerly (and panic on misconfiguration here rather
	// than on first request).
	_ = instance.Handler()

	jwtSvc, ok := instance.ServiceRegistry.Get(models.ServiceJWT.String()).(authulaservices.JWTService)
	if !ok {
		return nil, fmt.Errorf("auth: jwt service not registered by the jwt plugin")
	}

	userSvc, ok := instance.ServiceRegistry.Get(models.ServiceUser.String()).(authulaservices.UserService)
	if !ok {
		return nil, fmt.Errorf("auth: user service not registered by core services")
	}

	accountSvc, ok := instance.ServiceRegistry.Get(models.ServiceAccount.String()).(authulaservices.AccountService)
	if !ok {
		return nil, fmt.Errorf("auth: account service not registered by core services")
	}

	passwordSvc, ok := instance.ServiceRegistry.Get(models.ServicePassword.String()).(authulaservices.PasswordService)
	if !ok {
		return nil, fmt.Errorf("auth: password service not registered by core services")
	}

	return &Auth{
		instance:        instance,
		jwtService:      jwtSvc,
		userService:     userSvc,
		accountService:  accountSvc,
		passwordService: passwordSvc,
	}, nil
}

// Handler returns the net/http handler that serves all Authula routes
// (sign-in, sign-up, JWKS, token refresh, etc.). Mount it under
// BasePath via Fiber's adaptor.HTTPHandler.
func (a *Auth) Handler() http.Handler {
	return a.instance.Handler()
}

// JWTValidator validates a raw JWT access token string and returns the
// resolved Authula actor. It is a small interface (over a typed
// concrete struct) so that middleware code can be unit-tested with
// fakes.
type JWTValidator interface {
	ValidateToken(ctx context.Context, token string) (*models.Actor, error)
}

// UserLookup fetches a user's record from Authula's `users` table by
// its Authula-assigned id. We use it to obtain the email for the lazy
// local-user creation step.
type UserLookup interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
}

// NewJWTValidator returns a JWTValidator backed by the live Authula
// JWT service.
func (a *Auth) NewJWTValidator() JWTValidator {
	return a.jwtService
}

// NewUserLookup returns a UserLookup backed by the live Authula core
// user service.
func (a *Auth) NewUserLookup() UserLookup {
	return a.userService
}

// UserCreator creates a user account with a password in Authula.
type UserCreator interface {
	CreateUserWithPassword(ctx context.Context, name, email, password string) error
}

// NewUserCreator returns a UserCreator backed by the live Authula services.
func (a *Auth) NewUserCreator() UserCreator {
	return authulaUserCreator{
		userService:    a.userService,
		accountService: a.accountService,
		passwordService: a.passwordService,
	}
}

type authulaUserCreator struct {
	userService    authulaservices.UserService
	accountService authulaservices.AccountService
	passwordService authulaservices.PasswordService
}

func (c authulaUserCreator) CreateUserWithPassword(ctx context.Context, name, email, password string) error {
	hash, err := c.passwordService.Hash(password)
	if err != nil {
		return fmt.Errorf("auth: hash password: %w", err)
	}
	user, err := c.userService.Create(ctx, name, email, true, nil, nil)
	if err != nil {
		return fmt.Errorf("auth: create user: %w", err)
	}
	_, err = c.accountService.Create(ctx, user.ID, email, models.AuthProviderEmail.String(), &hash)
	if err != nil {
		return fmt.Errorf("auth: create account: %w", err)
	}
	return nil
}

// PasswordUpdater updates a user's password in Authula, verifying the old
// password first.
type PasswordUpdater interface {
	UpdatePassword(ctx context.Context, authulaUserID, oldPassword, newPassword string) error
}

// NewPasswordUpdater returns a PasswordUpdater backed by the live Authula
// services.
func (a *Auth) NewPasswordUpdater() PasswordUpdater {
	return authulaPasswordUpdater{
		accountService:  a.accountService,
		passwordService: a.passwordService,
	}
}

type authulaPasswordUpdater struct {
	accountService  authulaservices.AccountService
	passwordService authulaservices.PasswordService
}

func (u authulaPasswordUpdater) UpdatePassword(ctx context.Context, authulaUserID, oldPassword, newPassword string) error {
	account, err := u.accountService.GetByUserID(ctx, authulaUserID)
	if err != nil {
		return fmt.Errorf("auth: get account: %w", err)
	}
	if account.Password == nil || !u.passwordService.Verify(oldPassword, *account.Password) {
		return fmt.Errorf("%w: current password is incorrect", domain.ErrInvalidCredentials)
	}
	hash, err := u.passwordService.Hash(newPassword)
	if err != nil {
		return fmt.Errorf("auth: hash password: %w", err)
	}
	err = u.accountService.UpdateFields(ctx, authulaUserID, map[string]any{"password": hash})
	if err != nil {
		return fmt.Errorf("auth: update account password: %w", err)
	}
	return nil
}
