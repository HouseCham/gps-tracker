package middleware

import (
	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// LazyUser materialises a *domain.User from the validated Authula
// actor stored in LocalsKeyClaims. It is the second half of the auth
// pipeline (AuthJWT runs first).
//
// Why two middlewares, and not one? AuthJWT is purely
// transport-layer (header parsing, signature/expiry validation,
// blacklist check). LazyUser does the cross-store join: it fetches
// the email from Authula's users table, then asks the local users
// service to either return the matching local user or create one on
// the fly (preserving the "first user is super_admin" invariant).
//
// The local users service is responsible for the soft-deleted
// "resurrection" guard; this middleware merely translates its
// domain.ErrUnauthorized into a 401.
func LazyUser(svc *users.UserService, lookup auth.UserLookup) fiber.Handler {
	return func(c fiber.Ctx) error {
		actor, ok := c.Locals(LocalsKeyClaims).(*models.Actor)
		if !ok || actor == nil {
			return unauthorizedResponse(c, "missing authentication context")
		}

		authulaUser, err := lookup.GetByID(c.Context(), actor.ID)
		if err != nil {
			return unauthorizedResponse(c, "authentication subject unknown")
		}

		user, err := svc.GetOrCreate(c.Context(), authulaUser.Email, authulaUser.Name)
		if err != nil {
			return err
		}

		c.Locals(LocalsKeyUser, user)
		return c.Next()
	}
}

// UserFromCtx returns the local *domain.User previously stored by the
// LazyUser middleware, or nil if none is present.
func UserFromCtx(c fiber.Ctx) *domain.User {
	user, _ := c.Locals(LocalsKeyUser).(*domain.User)
	return user
}
