package middleware

import (
	"errors"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// X-Device-API-Key is the header the IoT device sends on every cycle.
// The value is an opaque lookup token; the server resolves it to a row
// in device_api_keys.
const XDeviceAPIKey = "X-Device-API-Key"

// RequireDeviceAPIKey is the IoT auth middleware. It runs on the public
// POST /api/v1/devices/:uuid_firmware/locations endpoint — no session
// cookie, no per-user access checks. The flow:
//
//  1. Read the X-Device-API-Key header (401 if absent / empty).
//  2. Resolve the URL's :uuid_firmware to a device.id (404 if not found).
//  3. Look the token up in device_api_keys (401 if no row matches).
//  4. Confirm key.device_id == resolved device.id (401 otherwise; we
//     return a uniform 401 to avoid leaking which (token, device) pairs
//     exist).
//
// On success, the validated device.id is stored under LocalsKeyDeviceID
// for the handler. The handler MUST NOT trust the URL's uuid_firmware
// alone — only the value stored in c.Locals.
//
// Usage:
//
//	app.Post("/api/v1/devices/:uuid_firmware/locations",
//	    middleware.RequireDeviceAPIKey(queries),
//	    middleware.ValidateRequestBody[dto.IngestLocationRequest](),
//	    deps.LocationsHandler.Ingest)
func RequireDeviceAPIKey(queries *postgres.Queries) fiber.Handler {
	return func(c fiber.Ctx) error {
		token := c.Get(XDeviceAPIKey)
		if token == "" {
			return missingKeyResponse(c)
		}

		uuidFirmware := c.Params("uuid_firmware")
		if uuidFirmware == "" {
			return c.Status(fiber.StatusBadRequest).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusBadRequest,
				Message:    "missing :uuid_firmware path param",
			})
		}

		deviceIDPg, err := queries.GetDeviceIDByUuidFirmware(c.Context(), uuidFirmware)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return deviceNotFoundResponse(c)
			}
			return c.Status(fiber.StatusInternalServerError).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusInternalServerError,
				Message:    "device lookup failed",
			})
		}
		deviceID := postgres.UuidFromPgtype(deviceIDPg)

		row, err := queries.GetActiveKeyByHash(c.Context(), token)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return invalidKeyResponse(c)
			}
			return c.Status(fiber.StatusInternalServerError).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusInternalServerError,
				Message:    "api key lookup failed",
			})
		}

		keyDeviceID := uuid.UUID(row.DeviceID.Bytes)
		if keyDeviceID != deviceID {
			return invalidKeyResponse(c)
		}

		c.Locals(LocalsKeyDeviceID, deviceID)
		return c.Next()
	}
}

func missingKeyResponse(c fiber.Ctx) error {
	return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusUnauthorized,
		Message:    "missing " + XDeviceAPIKey + " header",
	})
}

func invalidKeyResponse(c fiber.Ctx) error {
	return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusUnauthorized,
		Message:    "invalid or expired api key",
	})
}

func deviceNotFoundResponse(c fiber.Ctx) error {
	return c.Status(fiber.StatusNotFound).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusNotFound,
		Message:    "device not found",
	})
}
