package http

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type RouterDeps struct {
	Logger         *slog.Logger
	HealthHandler  *handlers.HealthHandler
	DevicesHandler *handlers.DevicesHandler
}

func NewRouter(deps RouterDeps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "gps-tracker-api",
		ErrorHandler: httpErrorHandler,
	})

	app.Get("/health", deps.HealthHandler.Handle)

	api := app.Group("/api")
	api.Get("/devices", middleware.DevUser(), deps.DevicesHandler.List)

	return app
}
