package http

import (
	"net/http"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/adaptor"

	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
)

type RouterDeps struct {
	HealthHandler  *handlers.HealthHandler
	DevicesHandler *handlers.DevicesHandler
	UsersHandler   *handlers.UsersHandler
	AccessHandler  *handlers.AccessHandler
	AccessService  *access.AccessService
	UsersService   *users.UserService
	AuthHandler      http.Handler
	AuthJWTValidator ports.JWTValidator
	AuthUserLookup   ports.UserLookup
}

// NewRouter creates a new fiber app and registers the routes and handlers.
func NewRouter(deps RouterDeps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "gps-tracker-api",
		ErrorHandler: httpErrorHandler,
	})
	app.Get("/health", deps.HealthHandler.Handle)

	// --- Authula: sign-in, sign-up, JWKS, token refresh, etc. ---
	// Mounted as a catch-all under the Authula base path. Authula
	// returns a net/http.Handler; we adapt it to a Fiber handler
	// via fasthttp's adaptor.
	if deps.AuthHandler != nil {
		authH := adaptor.HTTPHandler(deps.AuthHandler)
		app.All(auth.BasePath+"/*", authH)
	}

	// Reusable auth middlewares. The pair (AuthJWT -> LazyUser) is
	// applied to every protected route below.
	authJWT := middleware.AuthJWT(deps.AuthJWTValidator)
	lazyUser := middleware.LazyUser(deps.UsersService, deps.AuthUserLookup)

	// RequirePasswordChanged blocks users who haven't changed their
	// temporary password yet. Placed after LazyUser so we have the
	// domain.User available.
	requirePasswordChanged := middleware.RequirePasswordChanged()

	apiV1 := app.Group("/api/v1")
	// === Devices routes ===
	devices := apiV1.Group("/devices")
	devices.Get("/", authJWT, lazyUser, requirePasswordChanged, deps.DevicesHandler.List)
	devices.Get("/:id", authJWT, lazyUser, requirePasswordChanged, deps.DevicesHandler.Get)
	devices.Post("/",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.CreateDeviceRequest](),
		deps.DevicesHandler.Create,
	)
	devices.Put("/:id",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.UpdateDeviceRequest](),
		middleware.RequireDeviceRole(domain.AccessRoleEditor, deps.AccessService),
		deps.DevicesHandler.Update,
	)
	devices.Delete("/:id",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.DevicesHandler.Delete,
	)
	devices.Post("/:id/access",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.GrantAccessRequest](),
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.Grant,
	)
	devices.Get("/:id/access",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.List,
	)
	devices.Delete("/:id/access/:userId",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.AccessHandler.Revoke,
	)

	// === Users routes ===
	users := apiV1.Group("/users")
	users.Get("/",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		deps.UsersHandler.List,
	)
	users.Get("/:id", authJWT, lazyUser, requirePasswordChanged, deps.UsersHandler.GetByID)
	users.Post("/",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		middleware.ValidateRequestBody[dto.CreateUserRequest](),
		deps.UsersHandler.Create,
	)
	users.Put("/:id",
		authJWT,
		lazyUser,
		requirePasswordChanged,
		middleware.ValidateRequestBody[dto.UpdateUserRequest](),
		deps.UsersHandler.Update,
	)
	users.Delete("/:id", authJWT, lazyUser, requirePasswordChanged, deps.UsersHandler.Delete)

	// === Auth-related routes (application-level) ===
	// Change-password endpoint is exempt from requirePasswordChanged
	// so users with must_change_password = true can update it.
	authAPI := apiV1.Group("/auth")
	authAPI.Post("/change-password",
		authJWT,
		lazyUser,
		middleware.ValidateRequestBody[dto.ChangePasswordRequest](),
		deps.UsersHandler.ChangePassword,
	)

	return app
}
