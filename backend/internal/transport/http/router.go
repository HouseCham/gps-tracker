package http

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type RouterDeps struct {
	Logger         *slog.Logger
	HealthHandler  *handlers.HealthHandler
	DevicesHandler *handlers.DevicesHandler
	UsersHandler   *handlers.UsersHandler
	AccessService  *access.Service
}

// NewRouter creates a new fiber app and registers the routes and handlers.
func NewRouter(deps RouterDeps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "gps-tracker-api",
		ErrorHandler: httpErrorHandler,
	})
	app.Get("/health", deps.HealthHandler.Handle)

	apiV1 := app.Group("/api/v1")
	// === Devices routes ===
	devices := apiV1.Group("/devices", middleware.DevUser())
	devices.Get("/", middleware.DevUser(), deps.DevicesHandler.List)
	devices.Get("/:id", middleware.DevUser(), deps.DevicesHandler.Get)
	devices.Post("/",
		middleware.DevUser(),
		middleware.ValidateRequestBody[dto.CreateDeviceRequest](),
		deps.DevicesHandler.Create,
	)
	devices.Put("/:id",
		middleware.DevUser(),
		middleware.ValidateRequestBody[dto.UpdateDeviceRequest](),
		middleware.RequireDeviceRole(domain.AccessRoleEditor, deps.AccessService),
		deps.DevicesHandler.Update,
	)
	devices.Delete("/:id",
		middleware.DevUser(),
		middleware.RequireDeviceRole(domain.AccessRoleOwner, deps.AccessService),
		deps.DevicesHandler.Delete,
	)

	// === Users routes ===
	users := apiV1.Group("/users", middleware.DevUser())
	users.Get("/",
		middleware.DevUser(),
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		deps.UsersHandler.List,
	)
	users.Get("/:id", middleware.DevUser(), deps.UsersHandler.GetByID)
	users.Post("/",
		middleware.DevUser(),
		middleware.RequireUserRole(domain.UserRoleSuperAdmin),
		middleware.ValidateRequestBody[dto.CreateUserRequest](),
		deps.UsersHandler.Create,
	)
	users.Put("/:id",
		middleware.DevUser(),
		middleware.ValidateRequestBody[dto.UpdateUserRequest](),
		deps.UsersHandler.Update,
	)
	users.Delete("/:id", middleware.DevUser(), deps.UsersHandler.Delete)

	return app
}
