package http

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type RouterDeps struct {
	Logger         *slog.Logger
	HealthHandler  *handlers.HealthHandler
	DevicesHandler *handlers.DevicesHandler
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
	devices.Post("/",
		middleware.DevUser(),
		middleware.ValidateRequestBody[dto.CreateDeviceRequest](),
		deps.DevicesHandler.Create,
	)

	return app
}
