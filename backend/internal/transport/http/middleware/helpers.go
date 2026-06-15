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
