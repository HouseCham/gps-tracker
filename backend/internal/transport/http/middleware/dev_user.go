package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// DevUser is a temporary middleware that injects a fake *domain.User from
// the X-User-Id header. It exists so endpoints that require a user can be
// exercised end-to-end before real auth is wired.
//
// TODO: replace with AuthJWT + LazyUser middleware (Authula + DB lookup).
func DevUser() fiber.Handler {
	return func(c fiber.Ctx) error {
		raw := c.Get("X-User-Id")
		if raw == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing X-User-Id header")
		}
		id, err := uuid.Parse(raw)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid X-User-Id header")
		}
		user := &domain.User{
			ID:    id,
			Email: "dev@example.com",
			Role:  domain.UserRoleUser,
		}
		c.Locals(LocalsKeyUser, user)
		return c.Next()
	}
}
