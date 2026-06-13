package handlers

import (
	"github.com/gofiber/fiber/v3"
)

type HealthHandler struct{}

// NewHealthHandler creates a new instance of HealthHandler.
func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

// Handle processes the health check request and returns a JSON response indicating the service status.
func (h *HealthHandler) Handle(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
	})
}
