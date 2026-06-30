package handlers

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
	"github.com/HouseCham/gps-tracker/backend/utils"
)

type AccessHandler struct {
	service *access.AccessService
}

func NewAccessHandler(svc *access.AccessService) *AccessHandler {
	return &AccessHandler{service: svc}
}

// Grant handles POST /api/v1/devices/:id/access.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
// The granted role is always `viewer`; ownership transfer is not supported.
func (h *AccessHandler) Grant(c fiber.Ctx) error {
	const operation = "AccessHandler:Grant"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	deviceID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	req, ok := utils.GetValidatedBody[dto.GrantAccessRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	targetUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		log.Error(operation, "err", err, "field", "user_id")
		return middleware.BadRequestResponse(c, "invalid user id")
	}

	log.Debug(operation, "executing use case", "actorID", user.ID, "deviceID", deviceID, "targetUserID", targetUserID)
	grant, err := h.service.GrantAccess(c.Context(), user.ID, deviceID, targetUserID)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID, "targetUserID", targetUserID)
		return err
	}

	log.Info(operation, "access granted", "deviceID", deviceID, "targetUserID", targetUserID)
	return c.Status(fiber.StatusCreated).JSON(response.HTTPResponse[dto.GrantAccessResponse]{
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
	const operation = "AccessHandler:List"
	log.Debug(operation, "request received")

	if _, ok := middleware.GetRequestUser(c); !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	deviceID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	log.Debug(operation, "executing use case", "deviceID", deviceID)
	items, err := h.service.ListUsersForDevice(c.Context(), uuid.Nil, deviceID)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID)
		return err
	}

	resp := make([]dto.UserAccessOnDeviceResponse, 0, len(items))
	for _, it := range items {
		resp = append(resp, dto.UserAccessOnDeviceResponse{
			UserID:          it.UserID.String(),
			Name:            it.Name,
			Email:           it.Email,
			Role:            string(it.AccessRole),
			AccessGrantedAt: it.AccessGrantedAt,
		})
	}

	log.Info(operation, "device access list retrieved", "deviceID", deviceID, "count", len(items))
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[[]dto.UserAccessOnDeviceResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "device access list retrieved",
		Data:       resp,
	})
}

// Revoke handles DELETE /api/v1/devices/:id/access/:userId.
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *AccessHandler) Revoke(c fiber.Ctx) error {
	const operation = "AccessHandler:Revoke"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	deviceID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid device id")
	}

	targetUserID, err := middleware.ParseUUIDParam(c, "userId")
	if err != nil {
		log.Error(operation, "err", err, "param", "userId")
		return middleware.BadRequestResponse(c, "invalid user id")
	}

	log.Debug(operation, "executing use case", "actorID", user.ID, "deviceID", deviceID, "targetUserID", targetUserID)
	if err := h.service.RevokeAccess(c.Context(), user.ID, deviceID, targetUserID); err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID, "targetUserID", targetUserID)
		return err
	}

	log.Info(operation, "access revoked", "deviceID", deviceID, "targetUserID", targetUserID)
	return c.SendStatus(fiber.StatusNoContent)
}
