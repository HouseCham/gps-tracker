package handlers

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/utils"
)

type DevicesHandler struct {
	service *devices.Service
}

func NewDevicesHandler(svc *devices.Service) *DevicesHandler {
	return &DevicesHandler{service: svc}
}

// List handles GET /api/devices.
// It expects a *domain.User in c.Locals (set by an auth middleware).
func (h *DevicesHandler) List(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
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

	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[[]dto.DeviceWithAccessResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "devices retrieved",
		Data:       resp,
	})
}

// Get handles GET /api/devices/:id.
// Returns 404 when the device does not exist OR the user has no access
// (security through obscurity).
func (h *DevicesHandler) Get(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	device, err := h.service.GetByID(c.Context(), user.ID, id)
	if err != nil {
		return err
	}

	deviceData := dto.DeviceWithAccessFromDomain(device)
	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device retrieved",
		Data:       deviceData.DeviceResponse,
	})
}

// Update handles PUT /api/devices/:id.
// Access (editor or higher) is enforced by middleware.RequireDeviceRole.
func (h *DevicesHandler) Update(c fiber.Ctx) error {
	if _, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User); !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	req, ok := utils.GetValidatedBody[dto.UpdateDeviceRequest](c)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid request body",
		})
	}

	device, err := h.service.UpdateName(c.Context(), id, req.Name)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device updated",
		Data:       dto.DeviceFromDomain(device),
	})
}

// Create handles POST /api/devices.
// The caller is implicitly granted owner access to the new device.
func (h *DevicesHandler) Create(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	req, ok := utils.GetValidatedBody[dto.CreateDeviceRequest](c)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
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

	return c.Status(fiber.StatusCreated).JSON(domain.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusCreated,
		Message:    "device created",
		Data:       dto.DeviceFromDomain(device),
	})
}

// Delete handles DELETE /api/devices/:id.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
// The row is soft-deleted (deleted_at = NOW()); it is NOT physically removed.
func (h *DevicesHandler) Delete(c fiber.Ctx) error {
	if _, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User); !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	if err := h.service.SoftDelete(c.Context(), id); err != nil {
		return err
	}

	return c.SendStatus(fiber.StatusNoContent)
}
