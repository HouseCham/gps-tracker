package handlers

import (
	"log/slog"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type UsersHandler struct {
	usersService   *users.Service
	devicesService *devices.Service
	logger         *slog.Logger
}

func NewUsersHandler(usersSvc *users.Service, devicesSvc *devices.Service, logger *slog.Logger) *UsersHandler {
	return &UsersHandler{usersService: usersSvc, devicesService: devicesSvc, logger: logger}
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

	items, err := h.usersService.ListUsers(c.Context(), user.ID)
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

func (h *UsersHandler) GetByID(c fiber.Ctx) error {
	requestingUser, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(domain.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid user id",
		})
	}

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}
	if page < 1 {
		page = 1
	}

	pageSize := 10
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil {
			pageSize = parsed
		}
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	targetUser, err := h.usersService.GetByID(c.Context(), requestingUser.ID, targetUserID)
	if err != nil {
		return err
	}

	devicesList, total, err := h.devicesService.ListForUserPaginated(c.Context(), targetUserID, page, pageSize)
	if err != nil {
		return err
	}

	devicesResp := make([]dto.DeviceBasicResponse, 0, len(devicesList))
	for i := range devicesList {
		devicesResp = append(devicesResp, dto.DeviceBasicFromDomain(&devicesList[i]))
	}

	totalPages := total / pageSize
	if total%pageSize > 0 {
		totalPages++
	}

	return c.Status(fiber.StatusOK).JSON(domain.HTTPResponse[dto.UserWithDevicesResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "user retrieved",
		Data: dto.UserWithDevicesResponse{
			UserResponse: dto.UserFromDomain(targetUser),
			Devices:      devicesResp,
			Pagination: dto.PaginationMeta{
				Page:       page,
				PageSize:   pageSize,
				Total:      total,
				TotalPages: totalPages,
			},
		},
	})
}
