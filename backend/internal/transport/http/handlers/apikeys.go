package handlers

import (
	"fmt"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/apikeys"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

type APIKeysHandler struct {
	service *apikeys.Service
}

func NewAPIKeysHandler(svc *apikeys.Service) *APIKeysHandler {
	return &APIKeysHandler{service: svc}
}

// Create handles POST /api/v1/devices/:id/api-keys.
// Issues a new lookup token bound to the device. Refuses when the
// device already has an active key — the service returns
// domain.ErrConflict and the central httpErrorHandler maps it to
// 409 Conflict. To rotate, the caller must DELETE the existing key
// first.
//
// The response carries the plain token — this is the ONE place it
// ever travels on the wire. The admin UI must display it and discard;
// the service retains no copy.
//
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *APIKeysHandler) Create(c fiber.Ctx) error {
	const operation = "APIKeysHandler:Create"
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
	created, err := h.service.Create(c.Context(), deviceID)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID)
		return fmt.Errorf("APIKeysHandler.Create: %w", err)
	}

	log.Info(operation, "api key issued", "deviceID", deviceID, "keyID", created.Key.ID)
	return c.Status(fiber.StatusCreated).JSON(response.HTTPResponse[dto.CreateAPIKeyResponse]{
		StatusCode: fiber.StatusCreated,
		Message:    "api key issued",
		Data: dto.CreateAPIKeyResponse{
			APIKeyResponse: dto.APIKeyResponse{
				ID:         created.Key.ID.String(),
				CreatedAt:  created.Key.CreatedAt,
				LastUsedAt: created.Key.LastUsedAt,
				ExpiresAt:  created.Key.ExpiresAt,
			},
			PlainKey: created.Token,
		},
	})
}

// List handles GET /api/v1/devices/:id/api-keys.
// Returns metadata only (no token, no hash) so the admin UI can show
// "active / last used" without exposing the secret.
//
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *APIKeysHandler) List(c fiber.Ctx) error {
	const operation = "APIKeysHandler:List"
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
	items, err := h.service.ListForDevice(c.Context(), deviceID)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID)
		return fmt.Errorf("APIKeysHandler.List: %w", err)
	}

	resp := make([]dto.APIKeyResponse, 0, len(items))
	for _, k := range items {
		resp = append(resp, dto.APIKeyResponse{
			ID:         k.ID.String(),
			CreatedAt:  k.CreatedAt,
			LastUsedAt: k.LastUsedAt,
			ExpiresAt:  k.ExpiresAt,
		})
	}

	log.Info(operation, "api keys listed", "deviceID", deviceID, "count", len(items))
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[[]dto.APIKeyResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "api keys listed",
		Data:       resp,
	})
}

// Revoke handles DELETE /api/v1/devices/:id/api-keys/:keyId.
// Idempotent — revoking a non-existent / already-revoked key returns 204.
//
// Access (owner only) is enforced by middleware.RequireDeviceRole.
func (h *APIKeysHandler) Revoke(c fiber.Ctx) error {
	const operation = "APIKeysHandler:Revoke"
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

	keyID, err := middleware.ParseUUIDParam(c, "keyId")
	if err != nil {
		log.Error(operation, "err", err, "param", "keyId")
		return middleware.BadRequestResponse(c, "invalid key id")
	}

	log.Debug(operation, "executing use case", "deviceID", deviceID, "keyID", keyID)
	if err := h.service.Revoke(c.Context(), keyID); err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID, "keyID", keyID)
		return fmt.Errorf("APIKeysHandler.Revoke: %w", err)
	}

	log.Info(operation, "api key revoked", "deviceID", deviceID, "keyID", keyID)
	return c.SendStatus(fiber.StatusNoContent)
}
