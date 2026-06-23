package middleware

import (
	"strings"

	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// bearerPrefix is the expected prefix on the Authorization header
// value, per RFC 6750. We accept it case-insensitively to be lenient
// with clients.
const bearerPrefix = "bearer "

// AuthJWT validates the Bearer access token in the incoming request
// and stores the resolved Authula actor under LocalsKeyClaims. On any
// failure (missing header, malformed token, expired token, signature
// mismatch, revoked session) it short-circuits with 401.
//
// The middleware is intentionally transport-only: it never touches the
// database. Resolving a *domain.User from the actor is the job of the
// LazyUser middleware, which must run after this one.
func AuthJWT(validator ports.JWTValidator) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get(fiber.HeaderAuthorization)
		if header == "" {
			return unauthorizedResponse(c, "missing Authorization header")
		}
		if len(header) <= len(bearerPrefix) || !strings.EqualFold(header[:len(bearerPrefix)], bearerPrefix) {
			return unauthorizedResponse(c, "invalid Authorization header")
		}
		token := strings.TrimSpace(header[len(bearerPrefix):])
		if token == "" {
			return unauthorizedResponse(c, "empty bearer token")
		}

		actor, err := validator.ValidateToken(c.Context(), token)
		if err != nil {
			return unauthorizedResponse(c, "invalid or expired token")
		}
		if actor == nil || actor.ID == "" {
			return unauthorizedResponse(c, "token has no subject")
		}

		c.Locals(LocalsKeyClaims, actor)
		return c.Next()
	}
}

// ClaimsFromCtx returns the Authula actor previously stored by the
// AuthJWT middleware, or nil if none is present. Downstream code can
// use this to retrieve the actor without performing a type assertion
// in every handler.
func ClaimsFromCtx(c fiber.Ctx) *models.Actor {
	actor, _ := c.Locals(LocalsKeyClaims).(*models.Actor)
	return actor
}

// unauthorizedResponse returns a JSON response with a 401 status code
// and the supplied message.
func unauthorizedResponse(c fiber.Ctx, message string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusUnauthorized,
		Message:    message,
	})
}
