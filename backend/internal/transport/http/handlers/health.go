package handlers

import (
	"github.com/gofiber/fiber/v3"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) Handle(c fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
	})
}
