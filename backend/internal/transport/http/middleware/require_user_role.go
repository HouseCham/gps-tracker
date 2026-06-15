package middleware

import (
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

func RequireUserRole(minRole domain.UserRole) fiber.Handler {
	return func(c fiber.Ctx) error {
		user, ok := c.Locals(LocalsKeyUser).(*domain.User)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
				StatusCode: fiber.StatusUnauthorized,
				Message:    "unauthorized",
			})
		}

		if !roleSatisfies(user.Role, minRole) {
			return c.Status(fiber.StatusForbidden).JSON(domain.HTTPResponse[bool]{
				StatusCode: fiber.StatusForbidden,
				Message:    "forbidden",
			})
		}

		return c.Next()
	}
}

func roleSatisfies(actual, min domain.UserRole) bool {
	return roleRank(actual) >= roleRank(min)
}

func roleRank(r domain.UserRole) int {
	switch r {
	case domain.UserRoleSuperAdmin:
		return 2
	default:
		return 1
	}
}
