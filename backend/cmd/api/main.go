package main

import (
	"context"
	nethttp "net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/config"
	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
)

func main() {
	config.LoadEnv()
	log.Info("Starting server...")
	addr := ""
	if v := os.Getenv("API_PORT"); v != "" {
		if port, err := strconv.ParseUint(v, 10, 64); err == nil {
			addr = ":" + strconv.FormatUint(port, 10)
		}
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	startCtx, startCancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := postgres.NewPool(startCtx, dsn)
	startCancel()
	if err != nil {
		log.Error("create db pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	//-- devices
	devicesRepo := postgres.NewDevicesAdapter(pool)
	devicesService := devices.New(devicesRepo)
	//-- users
	usersRepo := postgres.NewUsersAdapter(pool)

	//-- auth (Authula). Reads AUTHULA_SECRET and AUTHULA_BASE_URL
	// from the env. Migrations run on first init.
	authCfg, err := config.LoadAuthConfig()
	if err != nil {
		log.Error("load auth config", "err", err)
		os.Exit(1)
	}
	var googleOAuth *auth.GoogleOAuthConfig
	if authCfg.GoogleOAuth != nil {
		googleOAuth = &auth.GoogleOAuthConfig{
			ClientID:     authCfg.GoogleOAuth.ClientID,
			ClientSecret: authCfg.GoogleOAuth.ClientSecret,
		}
	}
	// Flip the session cookie's `secure` flag on whenever we're
	// running in production. APP_ENV=development (the default) keeps
	// it off so contributors running without HTTPS can still sign in.
	secure := auth.IsProduction()
	authInstance, err := auth.Bootstrap(context.Background(), auth.Config{
		AppName:       authCfg.AppName,
		BaseURL:       authCfg.BaseURL,
		Secret:        authCfg.Secret,
		DatabaseURL:   authCfg.DatabaseURL,
		GoogleOAuth:   googleOAuth,
		SecureCookies: &secure,
	})
	if err != nil {
		log.Error("bootstrap auth", "err", err)
		os.Exit(1)
	}

	userCreator := authInstance.NewUserCreator()
	usersService := users.NewUserService(usersRepo, userCreator)

	// After-signup sync: Authula owns credentials, we own the
	// application-level projection (role, must_change_password, FKs).
	// Mirror every new Authula user into our local users table so the
	// unauthenticated bootstrap endpoint sees a non-empty table on
	// the first request after sign-up. LazyUser is the safety net
	// if the hook ever fails.
	authInstance.RegisterHook(models.Hook{
		Stage: models.HookAfter,
		Matcher: func(rc *models.RequestContext) bool {
			return rc.Method == nethttp.MethodPost &&
				rc.Path == auth.BasePath+"/email-password/sign-up" &&
				rc.Actor != nil && rc.Actor.Type == models.ActorUser
		},
		Handler: func(rc *models.RequestContext) error {
			lookup := authInstance.NewUserLookup()
			authulaUser, err := lookup.GetByID(rc.Request.Context(), rc.Actor.ID)
			if err != nil {
				//authula signup succeeded, local mirror is non-critical
				log.Error("signup hook: fetch authula user", "err", err)
				return nil
			}
			if _, err := usersService.GetOrCreate(rc.Request.Context(), authulaUser.Email, authulaUser.Name); err != nil {
				// failing to mirror doesn't roll back the signup
				log.Error("signup hook: mirror to local users", "err", err)
				return nil
			}
			return nil
		},
	})

	//-- access
	accessRepo := postgres.NewAccessAdapter(pool)
	accessService := access.NewAccessService(accessRepo, usersRepo)

	//-- handlers
	healthHandler := handlers.NewHealthHandler()
	devicesHandler := handlers.NewDevicesHandler(devicesService)
	passwordUpdater := authInstance.NewPasswordUpdater()
	sessionManager := authInstance.NewSessionManager()
	usersHandler := handlers.NewUsersHandler(usersService, devicesService, passwordUpdater, sessionManager)
	accessHandler := handlers.NewAccessHandler(accessService)


	app := http.NewRouter(http.RouterDeps{
		HealthHandler:     healthHandler,
		DevicesHandler:    devicesHandler,
		UsersHandler:      usersHandler,
		AccessHandler:     accessHandler,
		BootstrapHandler:  handlers.NewBootstrapHandler(usersService),
		AccessService:     accessService,
		UsersService:      usersService,
		AuthHandler:       authInstance.Handler(),
		SessionCookieName: authInstance.CookieName(),
		AuthSession:       authInstance.NewSessionAuthenticator(),
		AuthUserLookup:    authInstance.NewUserLookup().(ports.UserLookup),
		SessionManager:    sessionManager,
		CORSOrigins:       config.LoadCORSOrigins(),
	})

	server := http.NewServer(app, http.ServerConfig{
		Addr:            addr,
		ShutdownTimeout: 30 * time.Second,
	})

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := server.Run(ctx); err != nil {
		log.Error("server error", "err", err)
		os.Exit(1)
	}
}
