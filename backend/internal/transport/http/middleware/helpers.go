package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

func GetRequestUser(c fiber.Ctx) (*domain.User, bool) {
	user, ok := c.Locals(LocalsKeyUser).(*domain.User)
	return user, ok
}

// GetRequestDeviceID retrieves the device UUID resolved by the
// IoT auth middleware (RequireDeviceAPIKey). Handler code MUST use
// this value rather than the :uuid_firmware path param, since the
// middleware has verified that the (token, uuid_firmware) pair
// actually belong to the same device.
func GetRequestDeviceID(c fiber.Ctx) (uuid.UUID, bool) {
	id, ok := c.Locals(LocalsKeyDeviceID).(uuid.UUID)
	return id, ok
}

func UnauthorizedResponse(c fiber.Ctx) error {
	return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusUnauthorized,
		Message:    "unauthorized",
	})
}

func ParseUUIDParam(c fiber.Ctx, param string) (uuid.UUID, error) {
	return uuid.Parse(c.Params(param))
}

func BadRequestResponse(c fiber.Ctx, message string) error {
	return c.Status(fiber.StatusBadRequest).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusBadRequest,
		Message:    message,
	})
}

// unauthorizedResponse is the package-internal helper used by the
// auth middleware. The exported UnauthorizedResponse above has the
// same wire shape; this one exists so the middleware file does not
// have to spell out the response envelope on every 401.
func unauthorizedResponse(c fiber.Ctx, message string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusUnauthorized,
		Message:    message,
	})
}
