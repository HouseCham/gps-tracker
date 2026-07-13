package auth

import (
	nethttp "net/http"

	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
)

// SignupMirrorHook returns an Authula Hook that mirrors every successful
// email-password sign-up into the local users table. The Authula signup
// is the source of truth for credentials; our local users table is the
// projection for role / FK relationships. Lazy lookup in the auth
// middleware is the safety net if this hook ever fails, so failures
// here are logged but do NOT roll back the signup.
func SignupMirrorHook(a *Auth, usersSvc *users.Service) models.Hook {
	return models.Hook{
		Stage: models.HookAfter,
		Matcher: func(rc *models.RequestContext) bool {
			return rc.Method == nethttp.MethodPost &&
				rc.Path == BasePath+"/email-password/sign-up" &&
				rc.Actor != nil && rc.Actor.Type == models.ActorUser
		},
		Handler: func(rc *models.RequestContext) error {
			authulaUser, err := a.NewUserLookup().GetByID(rc.Request.Context(), rc.Actor.ID)
			if err != nil {
				// authula signup succeeded, local mirror is non-critical
				log.Error("signup hook: fetch authula user", "err", err)
				return nil
			}
			if _, err := usersSvc.GetOrCreate(rc.Request.Context(), authulaUser.Email, authulaUser.Name); err != nil {
				// failing to mirror doesn't roll back the signup
				log.Error("signup hook: mirror to local users", "err", err)
				return nil
			}
			return nil
		},
	}
}
