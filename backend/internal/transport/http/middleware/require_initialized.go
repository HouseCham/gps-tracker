package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// RequireInitialized blocks requests on routes registered after the
// middleware when the local users table is empty. The Authula signup
// endpoint is mounted outside the /api/v1 group, so it remains
// reachable and can create the first user; the /system/bootstrap
// endpoint is registered on the group BEFORE this middleware, so
// Fiber v3's group middleware applies only to routes registered
// after the Use call and exempts it.
//
// Failure mode: when the count query errors, the middleware passes
// the request through rather than blocking the entire app. This
// mirrors BootstrapHandler.Handle which propagates the error
// upstream, and keeps the API reachable if the database briefly
// hiccups during the bootstrap window.
func RequireInitialized(usersService *users.Service) fiber.Handler {
	return func(c fiber.Ctx) error {
		count, err := usersService.CountUsers(c.Context())
		if err != nil {
			log.Error("RequireInitialized: count users", "err", err)
			return c.Next()
		}

		if count == 0 {
			return c.Status(fiber.StatusConflict).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusConflict,
				Message:    "system not initialized",
				Data:       false,
			})
		}

		return c.Next()
	}
}