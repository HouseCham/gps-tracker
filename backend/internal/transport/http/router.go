package http

import (
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/adaptor"
	"github.com/gofiber/fiber/v3/middleware/cors"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
)

type RouterDeps struct {
	HealthHandler    *handlers.HealthHandler
	DevicesHandler   *handlers.DevicesHandler
	UsersHandler     *handlers.UsersHandler
	AccessHandler    *handlers.AccessHandler
	BootstrapHandler *handlers.BootstrapHandler
	AccessService    *access.AccessService
	UsersService     *users.Service
	AuthHandler      http.Handler
	SessionCookieName string
	AuthSession      ports.SessionAuthenticator
	AuthUserLookup   ports.UserLookup
	SessionManager   ports.SessionManager
	// CORSOrigins enables the CORS middleware when non-empty. Each
	// entry is an allowed origin (e.g. "http://localhost:4321"). When
	// the frontend and backend share an origin (reverse-proxied or
	// same-host) leave this nil and the middleware is skipped.
	CORSOrigins []string
}

// NewRouter creates a new fiber app and registers the routes and handlers.
func NewRouter(deps RouterDeps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "gps-tracker-api",
		ErrorHandler: httpErrorHandler,
	})

	// CORS is opt-in: only mounted when origins are configured.
	// Must run before any route, including the Authula catch-all.
	if len(deps.CORSOrigins) > 0 {
		app.Use(cors.New(cors.Config{
			AllowOrigins:     deps.CORSOrigins,
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Cookie"},
			AllowCredentials: true,
		}))
	}

	app.Get("/health", deps.HealthHandler.Handle)

	// Single session-cookie auth middleware. Replaces the old
	// (AuthJWT -> LazyUser) pair: cookie lookup + actor resolution
	// + local user materialisation all happen here, downstream code
	// reads the same LocalsKeyClaims / LocalsKeyUser locals.
	authSession := middleware.AuthSession(deps.SessionCookieName, deps.AuthSession, deps.AuthUserLookup, deps.UsersService)

	// --- Authula: sign-in, sign-up, JWKS, token refresh, etc. ---
	// Mounted as a catch-all under the Authula base path. Authula
	// returns a net/http.Handler; we adapt it to a Fiber handler
	// via fasthttp's adaptor.
	if deps.AuthHandler != nil {
		// GET /api/auth/me is served by Fiber, not Authula, because
		// Authula's validateSessionHook is PluginID-scoped and the
		// core /me route has no plugin metadata, so the actor is
		// never set and the route 401s. We have the session cookie
		// and the actor in locals already (authSession above) — just
		// project the user. Registered first so Fiber's static route
		// wins over the catch-all below.
		app.Get(auth.BasePath+"/me", authSession, deps.UsersHandler.Me)

		// Sign-out reads the token from X-Session-Token header (which the
		// frontend sends instead of the Cookie header), invalidates via
		// Authula's session service, and clears the cookie. Registered
		// before the catch-all so it takes priority over Authula's own
		// /sign-out route which requires the Cookie header.
		app.Post(auth.BasePath+"/sign-out", deps.UsersHandler.SignOut)

		authH := adaptor.HTTPHandler(deps.AuthHandler)
		app.All(auth.BasePath+"/*", authH)
	}

	// RequirePasswordChanged blocks users who haven't changed their
	// temporary password yet. Placed after AuthSession so we have
	// the domain.User available.
	requirePasswordChanged := middleware.RequirePasswordChanged()

	apiV1 := app.Group("/api/v1")

	// === System routes (public, no auth) ===
	// The bootstrap endpoint is intentionally exposed without any
	// auth middleware so the frontend can ask "is the app empty?"
	// before the user has signed in.
	apiV1.Get("/system/bootstrap", deps.BootstrapHandler.Handle)

	// RequireInitialized is mounted on the group AFTER the bootstrap
	// route, so Fiber v3 only applies it to routes registered below.
	// It blocks every other /api/v1/* request until the first user
	// exists. The Authula signup endpoint lives under /api/auth/*
	// outside this group and is unaffected.
	apiV1.Use(middleware.RequireInitialized(deps.UsersService))

	// === Devices routes ===
	// /devices/count is registered on apiV1 directly (not on the group)
	// so the static segment wins over the /:id route below — Fiber v3
	// groups register routes into the same trie in registration order,
	// and a /:id registered later still shadows a static /count when the
	// group already has a parent node for the literal segment.
	apiV1.Get("/devices/count", authSession, requirePasswordChanged, deps.DevicesHandler.Count)

	devices := apiV1.Group("/devices")
	devices.Get("/", authSession, requirePasswordChanged, deps.DevicesHandler.List)
	devices.Get("/:id", authSession, requirePasswordChanged, deps.DevicesHandler.Get)
	devices.Post("/",
		authSession,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.CreateDeviceRequest](),
		deps.DevicesHandler.Create,
	)
	devices.Put("/:id",
		authSession,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.UpdateDeviceRequest](),
		middleware.RequireDeviceRole(domain.AccessRoleEditor, deps.AccessService),
		deps.DevicesHandler.Update,
	)
	devices.Delete("/:id",
		authSession,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.DevicesHandler.Delete,
	)
	devices.Post("/:id/access",
		authSession,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.GrantAccessRequest](),
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.Grant,
	)
	devices.Get("/:id/access",
		authSession,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.List,
	)
	devices.Delete("/:id/access/:userId",
		authSession,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.Revoke,
	)

	// === Users routes ===
	users := apiV1.Group("/users")
	users.Get("/",
		authSession,
		requirePasswordChanged,
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		deps.UsersHandler.List,
	)
	// /users/me is registered on apiV1 directly (not on the group) so
	// the static segment wins over the /:id route below. Same Fiber v3
	// routing constraint as /devices/count above.
	apiV1.Get("/users/me", authSession, requirePasswordChanged, deps.UsersHandler.GetMe)
	users.Get("/:id", authSession, requirePasswordChanged, deps.UsersHandler.GetByID)
	users.Post("/",
		authSession,
		requirePasswordChanged,
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		middleware.ValidateRequestBody[dto.CreateUserRequest](),
		deps.UsersHandler.Create,
	)
	users.Put("/:id",
		authSession,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.UpdateUserRequest](),
		deps.UsersHandler.Update,
	)
	users.Delete("/:id", authSession, requirePasswordChanged, deps.UsersHandler.Delete)

	// === Auth-related routes (application-level) ===
	// Change-password endpoint is exempt from requirePasswordChanged
	// so users with must_change_password = true can update it.
	authAPI := apiV1.Group("/auth")
	authAPI.Post("/change-password",
		authSession,
		middleware.ValidateRequestBody[dto.ChangePasswordRequest](),
		deps.UsersHandler.ChangePassword,
	)

	return app
}
