package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// RequireDeviceRole returns a middleware that allows the request through only
// if the authenticated user has at least `minRole` on the device whose ID
// is in the :id path param. Behavior:
//   - 401 if no user is in context (LazyUser must run first)
//   - 400 if :id is not a valid UUID
//   - 404 if the user has no access (security through obscurity)
//   - 403 if the user has access but the role is below the minimum
//
// The middleware fails fast: it does not store the resolved role in
// c.Locals. The handler downstream can re-query if it needs to.
func RequireDeviceRole(minRole domain.AccessRole, svc *access.AccessService) fiber.Handler {
	return func(c fiber.Ctx) error {
		user, ok := c.Locals(LocalsKeyUser).(*domain.User)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
				StatusCode: fiber.StatusUnauthorized,
				Message:    "unauthorized",
			})
		}

		deviceID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
				StatusCode: fiber.StatusBadRequest,
				Message:    "invalid device id",
			})
		}

		if err := svc.RequireRole(c.Context(), user.ID, deviceID, minRole); err != nil {
			return err
		}

		return c.Next()
	}
}
