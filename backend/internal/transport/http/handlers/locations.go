package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/locations"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/utils"
)

type LocationsHandler struct {
	service *locations.Service
}

func NewLocationsHandler(svc *locations.Service) *LocationsHandler {
	return &LocationsHandler{service: svc}
}

// Ingest handles POST /api/v1/devices/:uuid_firmware/locations.
// Auth (device API key + uuid → device_id) is enforced by
// middleware.RequireDeviceAPIKey upstream; the handler does not
// re-check.
//
// The :uuid_firmware param is informational only — the middleware
// already resolved and stored the canonical device.id in c.Locals
// under LocalsKeyDeviceID. We never trust the path param itself
// because a device sending valid X-Device-API-Key with one
// :uuid_firmware and a stolen UUID for a different device is the
// threat model the middleware's device_id-equality check addresses.
//
// Idempotency: same body (same recorded_at) on the same device is
// a no-op at the DB layer (ON CONFLICT DO NOTHING). The handler
// therefore returns 201 on success regardless of whether the row
// is fresh or already-present — clients can retry safely.
func (h *LocationsHandler) Ingest(c fiber.Ctx) error {
	const operation = "LocationsHandler:Ingest"
	log.Debug(operation, "request received")

	deviceID, ok := middleware.GetRequestDeviceID(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized, "reason", "missing device_id in locals")
		return middleware.UnauthorizedResponse(c)
	}

	req, ok := utils.GetValidatedBody[dto.IngestLocationRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	log.Debug(operation, "executing use case", "deviceID", deviceID, "recorded_at", req.RecordedAt)
	loc, err := toDomainIngest(req, deviceID)
	if err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID)
		return fmt.Errorf("LocationsHandler.Ingest: parse body: %w", err)
	}
	if err := h.service.Ingest(c.Context(), loc); err != nil {
		log.Error(operation, "err", err, "deviceID", deviceID)
		return fmt.Errorf("LocationsHandler.Ingest: %w", err)
	}

	log.Info(operation, "location ingested", "deviceID", deviceID)
	return c.SendStatus(fiber.StatusCreated)
}

// toDomainIngest projects the validated DTO into a domain.LocationIngest.
// Time parsing is the only nontrivial bit — the DTO's rfc3339 validator
// already confirmed the format, so a failure here is a logic bug.
func toDomainIngest(req dto.IngestLocationRequest, deviceID uuid.UUID) (domain.LocationIngest, error) {
	recordedAt, err := time.Parse(time.RFC3339, req.RecordedAt)
	if err != nil {
		return domain.LocationIngest{}, err
	}
	return domain.LocationIngest{
		DeviceID:       deviceID,
		RecordedAt:     recordedAt,
		Latitude:       req.Latitude,
		Longitude:      req.Longitude,
		Altitude:       req.Altitude,
		Speed:          req.Speed,
		Accuracy:       req.Accuracy,
		BatteryVoltage: req.BatteryVoltage,
		SignalStrength: req.SignalStrength,
	}, nil
}
