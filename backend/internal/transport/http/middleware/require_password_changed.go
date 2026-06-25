package middleware

import (
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// RequirePasswordChanged returns a middleware that blocks requests when
// the authenticated user still has must_change_password = true (i.e.
// they were created by an admin and haven't changed their temporary
// password yet). The change-password endpoint itself must be excluded
// from this check so the user can actually update their password.
func RequirePasswordChanged() fiber.Handler {
	return func(c fiber.Ctx) error {
		user, ok := c.Locals(LocalsKeyUser).(*domain.User)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusUnauthorized,
				Message:    "unauthorized",
			})
		}

		if user.MustChangePassword {
			return c.Status(fiber.StatusForbidden).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusForbidden,
				Message:    "must_change_password",
			})
		}

		return c.Next()
	}
}
