package handlers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/model"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/utils"
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
		return c.Status(fiber.StatusUnauthorized).JSON(model.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
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

// Get handles GET /api/devices/:id.
// Returns 404 when the device does not exist OR the user has no access
// (security through obscurity).
func (h *DevicesHandler) Get(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(model.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	device, err := h.service.GetByID(c.Context(), user.ID, id)
	if err != nil {
		return err
	}

	return c.JSON(dto.DeviceWithAccessFromDomain(device))
}

// Create handles POST /api/devices.
// The caller is implicitly granted owner access to the new device.
func (h *DevicesHandler) Create(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(model.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	req, ok := utils.GetValidatedBody[dto.CreateDeviceRequest](c)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(model.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid request body",
		})
	}

	device, err := h.service.Create(c.Context(), devices.CreateInput{
		UuidFirmware: req.UuidFirmware,
		Name:         req.Name,
		OwnerID:      user.ID,
	})
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.DeviceWithAccessResponse{
		DeviceResponse: dto.DeviceFromDomain(device),
		AccessRole:     string(domain.AccessRoleOwner),
	})
}
