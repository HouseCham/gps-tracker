package handlers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type DevicesHandler struct {
	service *devices.Service
	logger  *slog.Logger
}

func NewDevicesHandler(svc *devices.Service, logger *slog.Logger) *DevicesHandler {
	return &DevicesHandler{service: svc, logger: logger}
}

// List handles GET /api/devices.
// It expects a *domain.User in c.Locals (set by an auth middleware).
func (h *DevicesHandler) List(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "unauthorized")
	}

	items, err := h.service.ListMine(c.Context(), user.ID)
	if err != nil {
		return err
	}

	resp := make([]dto.DeviceWithAccessResponse, 0, len(items))
	for i := range items {
		resp = append(resp, dto.DeviceWithAccessFromDomain(&items[i]))
	}
	return c.JSON(resp)
}
