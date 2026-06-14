package handlers

import (
	"log/slog"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type UsersHandler struct {
	service *users.Service
	logger  *slog.Logger
}

func NewUsersHandler(svc *users.Service, logger *slog.Logger) *UsersHandler {
	return &UsersHandler{service: svc, logger: logger}
}

// Retrieves a list of all the users in the system. This endpoint is protected and requires authentication and "owner" role.
func (h *UsersHandler) List(c fiber.Ctx) error {
	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	items, err := h.service.ListUsers(c.Context(), user.ID)
	if err != nil {
		return err
	}

	resp := make([]dto.UserResponse, 0, len(items))
	for i := range items {
		resp = append(resp, dto.UserFromDomain(&items[i]))
	}

	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[[]dto.UserResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "users retrieved",
		Data:       resp,
	})
}
