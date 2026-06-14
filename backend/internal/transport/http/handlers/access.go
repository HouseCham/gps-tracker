package handlers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/utils"
)

type AccessHandler struct {
	service *access.Service
	logger  *slog.Logger
}

func NewAccessHandler(svc *access.Service, logger *slog.Logger) *AccessHandler {
	return &AccessHandler{service: svc, logger: logger}
}

// Grant handles POST /api/v1/devices/:id/access.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
// The granted role is always `viewer`; ownership transfer is not supported.
func (h *AccessHandler) Grant(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	deviceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	req, ok := utils.GetValidatedBody[dto.GrantAccessRequest](c)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid request body",
		})
	}

	targetUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid user id",
		})
	}

	grant, err := h.service.GrantAccess(c.Context(), user.ID, deviceID, targetUserID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(domain.HTTPResponse[dto.GrantAccessResponse]{
		StatusCode: fiber.StatusCreated,
		Message:    "access granted",
		Data: dto.GrantAccessResponse{
			UserID:    grant.UserID.String(),
			DeviceID:  grant.DeviceID.String(),
			Role:      string(grant.Role),
			CreatedAt: grant.CreatedAt,
		},
	})
}

// List handles GET /api/v1/devices/:id/access.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *AccessHandler) List(c fiber.Ctx) error {
	if _, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User); !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	deviceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	items, err := h.service.ListUsersForDevice(c.Context(), uuid.Nil, deviceID)
	if err != nil {
		return err
	}

	resp := make([]dto.UserAccessOnDeviceResponse, 0, len(items))
	for _, it := range items {
		resp = append(resp, dto.UserAccessOnDeviceResponse{
			UserID:          it.UserID.String(),
			Email:           it.Email,
			Role:            string(it.AccessRole),
			AccessGrantedAt: it.AccessGrantedAt,
		})
	}

	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[[]dto.UserAccessOnDeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device access list retrieved",
		Data:       resp,
	})
}

// Revoke handles DELETE /api/v1/devices/:id/access/:userId.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *AccessHandler) Revoke(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	deviceID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid device id",
		})
	}

	targetUserID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid user id",
		})
	}

	if err := h.service.RevokeAccess(c.Context(), user.ID, deviceID, targetUserID); err != nil {
		return err
	}

	return c.SendStatus(fiber.StatusNoContent)
}
