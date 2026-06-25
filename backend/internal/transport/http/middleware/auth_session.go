package middleware

import (
	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
)

// AuthSession is the single middleware that gates every protected
// route. It reads the HTTP-only session cookie set by Authula's
// session plugin, resolves it back to an Authula actor, mirrors the
// user into the local users table on the fly (preserving the
// "first user is super_admin" invariant), and stores both shapes
// (the actor and the local domain.User) in the Fiber locals for
// downstream middlewares / handlers to consume.
//
// Why one middleware and not two? The original design split the
// validation (AuthJWT) from the user materialisation (LazyUser)
// because JWT validation is purely transport-layer while user
// resolution hits the database. With cookies the split is
// unnecessary — the cookie lookup is cheap, the user join is the
// same call, and the two responsibilities always run together.
func AuthSession(cookieName string, authenticator ports.SessionAuthenticator, lookup ports.UserLookup, svc *users.UserService) fiber.Handler {
	return func(c fiber.Ctx) error {
		cookie := c.Cookies(cookieName)
		actor, err := authenticator.Authenticate(c.Context(), cookie)
		if err != nil || actor == nil || actor.ID == "" {
			return unauthorizedResponse(c, "invalid or expired session")
		}

		authulaUser, err := lookup.GetByID(c.Context(), actor.ID)
		if err != nil {
			return unauthorizedResponse(c, "authentication subject unknown")
		}

		user, err := svc.GetOrCreate(c.Context(), authulaUser.Email, authulaUser.Name)
		if err != nil {
			return unauthorizedResponse(c, "failed to materialize local user")
		}

		c.Locals(LocalsKeyClaims, actor)
		c.Locals(LocalsKeyUser, user)
		return c.Next()
	}
}

// ClaimsFromCtx returns the Authula actor previously stored by the
// AuthSession middleware, or nil if none is present. Downstream code
// can use this to retrieve the actor without performing a type
// assertion in every handler.
func ClaimsFromCtx(c fiber.Ctx) *models.Actor {
	actor, _ := c.Locals(LocalsKeyClaims).(*models.Actor)
	return actor
}