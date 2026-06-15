package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
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
// Supports pagination via query params: page (default 1), page_size (default 20, max 100).
func (h *DevicesHandler) List(c fiber.Ctx) error {
	const operation = "DevicesHandler:List"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}
	if page < 1 {
		page = 1
	}

	pageSize := 20
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil {
			pageSize = parsed
		}
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	log.Debug(operation, "executing use case", "userID", user.ID, "page", page, "pageSize", pageSize)
	items, total, err := h.service.ListMinePaginated(c.Context(), user.ID, page, pageSize)
	if err != nil {
		log.Error(operation, "err", err)
		return err
	}

	resp := make([]dto.DeviceWithAccessResponse, 0, len(items))
	for i := range items {
		resp = append(resp, dto.DeviceWithAccessFromDomain(&items[i]))
	}

	totalPages := total / pageSize
	if total%pageSize > 0 {
		totalPages++
	}

	log.Info(operation, "devices retrieved", "count", len(items), "total", total)
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[dto.DeviceListResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "devices retrieved",
		Data: dto.DeviceListResponse{
			Items: resp,
			Pagination: dto.PaginationMeta{
				Page:       page,
				PageSize:   pageSize,
				Total:      total,
				TotalPages: totalPages,
			},
		},
	})
}

// Get handles GET /api/devices/:id.
// Returns 404 when the device does not exist OR the user has no access
// (security through obscurity).
func (h *DevicesHandler) Get(c fiber.Ctx) error {
	const operation = "DevicesHandler:Get"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	id, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	log.Debug(operation, "executing use case", "userID", user.ID, "deviceID", id)
	device, err := h.service.GetByID(c.Context(), user.ID, id)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", id)
		return err
	}

	deviceData := dto.DeviceWithAccessFromDomain(device)
	log.Info(operation, "device retrieved", "deviceID", id)
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device retrieved",
		Data:       deviceData.DeviceResponse,
	})
}

// Update handles PUT /api/devices/:id.
// Access (editor or higher) is enforced by middleware.RequireDeviceRole.
func (h *DevicesHandler) Update(c fiber.Ctx) error {
	const operation = "DevicesHandler:Update"
	log.Debug(operation, "request received")

	if _, ok := middleware.GetRequestUser(c); !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	id, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	req, ok := utils.GetValidatedBody[dto.UpdateDeviceRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	log.Debug(operation, "executing use case", "deviceID", id, "name", req.Name)
	device, err := h.service.UpdateName(c.Context(), id, req.Name)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", id)
		return err
	}

	log.Info(operation, "device updated", "deviceID", id)
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device updated",
		Data:       dto.DeviceFromDomain(device),
	})
}

// Create handles POST /api/devices.
// The caller is implicitly granted owner access to the new device.
func (h *DevicesHandler) Create(c fiber.Ctx) error {
	const operation = "DevicesHandler:Create"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	req, ok := utils.GetValidatedBody[dto.CreateDeviceRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	log.Debug(operation, "executing use case", "userID", user.ID, "uuidFirmware", req.UuidFirmware)
	device, err := h.service.Create(c.Context(), devices.CreateInput{
		UuidFirmware: req.UuidFirmware,
		Name:         req.Name,
		OwnerID:      user.ID,
	})
	if err != nil {
		log.Error(operation, "err", err)
		return err
	}

	log.Info(operation, "device created", "deviceID", device.ID)
	return c.Status(fiber.StatusCreated).JSON(response.HTTPResponse[dto.DeviceResponse]{
		StatusCode: fiber.StatusCreated,
		Message:    "device created",
		Data:       dto.DeviceFromDomain(device),
	})
}

// Delete handles DELETE /api/devices/:id.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
// The row is soft-deleted (deleted_at = NOW()); it is NOT physically removed.
func (h *DevicesHandler) Delete(c fiber.Ctx) error {
	const operation = "DevicesHandler:Delete"
	log.Debug(operation, "request received")

	if _, ok := middleware.GetRequestUser(c); !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	id, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	log.Debug(operation, "executing use case", "deviceID", id)
	if err := h.service.SoftDelete(c.Context(), id); err != nil {
		log.Error(operation, "err", err, "deviceID", id)
		return err
	}

	log.Info(operation, "device deleted", "deviceID", id)
	return c.SendStatus(fiber.StatusNoContent)
}
