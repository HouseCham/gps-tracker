package middleware

import (
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// RequireUserRole returns a middleware that allows the request through only
// if the authenticated user has at least minRole.
func RequireUserRole(minRole domain.UserRole) fiber.Handler {
	return func(c fiber.Ctx) error {
		user, ok := c.Locals(LocalsKeyUser).(*domain.User)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusUnauthorized,
				Message:    "unauthorized",
			})
		}

		if !user.Role.Satisfies(minRole) {
			return c.Status(fiber.StatusForbidden).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusForbidden,
				Message:    "forbidden",
			})
		}

		return c.Next()
	}
}
