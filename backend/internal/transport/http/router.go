package http

import (
	"log/slog"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
)

type RouterDeps struct {
	Logger        *slog.Logger
	HealthHandler *handlers.HealthHandler
}

// NewRouter creates a new Fiber app with the defined routes and handlers.
func NewRouter(deps RouterDeps) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      os.Getenv("APP_NAME"),
		ErrorHandler: httpErrorHandler,
	})

	app.Get("/health", deps.HealthHandler.Handle)

	return app
}
