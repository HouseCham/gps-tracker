package handlers

import (
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
)

// BootstrapHandler answers the first-run question: is there at least one
// active user in the local `users` table? The frontend uses this to
// decide whether the visitor should be sent to the sign-up page
// (first user becomes super_admin) or straight to the sign-in page.
type BootstrapHandler struct {
	usersService *users.Service
}

// NewBootstrapHandler wires the handler to the users service.
func NewBootstrapHandler(usersService *users.Service) *BootstrapHandler {
	return &BootstrapHandler{usersService: usersService}
}

// Handle processes GET /api/v1/system/bootstrap.
//
// Intentionally unauthenticated: this is the endpoint the frontend
// hits before the user has had a chance to sign in. It only exposes
// a boolean — whether the user table is empty — which is the same
// information an unauthenticated caller could derive by attempting
// to read public user data anyway.
func (h *BootstrapHandler) Handle(c fiber.Ctx) error {
	log.Info("BootstrapHandler:Handle", "request received")
	count, err := h.usersService.CountUsers(c.Context())
	if err != nil {
		log.Error("BootstrapHandler:Handle", "error:", err)
		return err
	}
	return c.JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusOK,
		Message:    "ok",
		Data:       count == 0,
	})
}