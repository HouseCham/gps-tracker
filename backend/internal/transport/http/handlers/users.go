package handlers

import (
	"strconv"

	"github.com/Authula/authula/models"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/ports"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
	"github.com/HouseCham/gps-tracker/backend/utils"
)

type UsersHandler struct {
	usersService    *users.UserService
	devicesService  *devices.Service
	passwordUpdater ports.PasswordUpdater
}

func NewUsersHandler(usersSvc *users.UserService, devicesSvc *devices.Service, passwordUpdater ports.PasswordUpdater) *UsersHandler {
	return &UsersHandler{usersService: usersSvc, devicesService: devicesSvc, passwordUpdater: passwordUpdater}
}

// List handles GET /api/v1/users.
// Requires super_admin role (enforced by middleware).
func (h *UsersHandler) List(c fiber.Ctx) error {
	const operation = "UsersHandler:List"
	log.Debug(operation, "request received")

	user, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	log.Debug(operation, "executing use case", "userID", user.ID)
	items, err := h.usersService.ListUsers(c.Context(), user.ID)
	if err != nil {
		log.Error(operation, "err", err)
		return err
	}

	resp := make([]dto.UserResponse, 0, len(items))
	for i := range items {
		resp = append(resp, dto.UserFromDomain(&items[i]))
	}

	log.Info(operation, "users retrieved", "count", len(items))
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[[]dto.UserResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "users retrieved",
		Data:       resp,
	})
}

// GetByID handles GET /api/v1/users/:id.
// Returns user info with paginated device list.
func (h *UsersHandler) GetByID(c fiber.Ctx) error {
	const operation = "UsersHandler:GetByID"
	log.Debug(operation, "request received")

	requestingUser, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	targetUserID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid user id")
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

	targetUser, err := h.usersService.GetByID(c.Context(), requestingUser.ID, targetUserID)
	if err != nil {
		log.Error(operation, "err", err, "targetUserID", targetUserID)
		return err
	}

	devicesList, total, err := h.devicesService.ListForUserPaginated(c.Context(), targetUserID, page, pageSize)
	if err != nil {
		log.Error(operation, "err", err, "targetUserID", targetUserID)
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

	log.Info(operation, "user retrieved", "targetUserID", targetUserID, "deviceCount", len(devicesList))
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[dto.UserWithDevicesResponse]{
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

// Create handles POST /api/v1/users.
// Requires super_admin role (enforced by middleware).
func (h *UsersHandler) Create(c fiber.Ctx) error {
	const operation = "UsersHandler:Create"
	log.Debug(operation, "request received")

	if _, ok := middleware.GetRequestUser(c); !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	req, ok := utils.GetValidatedBody[dto.CreateUserRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	result, err := h.usersService.CreateUser(
		c.Context(),
		req.Email,
		req.Name,
		req.Lastname,
		domain.UserRole(req.Role),
	)
	if err != nil {
		log.Error(operation, "err", err)
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(response.HTTPResponse[dto.CreateUserResponse]{
		StatusCode: fiber.StatusCreated,
		Message:    "user created",
		Data:       dto.CreateUserResponseFromDomain(result.User, result.TemporaryPassword),
	})
}

// Update handles PUT /api/v1/users/:id.
// Users can only update their own profile (enforced in handler).
func (h *UsersHandler) Update(c fiber.Ctx) error {
	const operation = "UsersHandler:Update"
	log.Debug(operation, "request received")

	requestingUser, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	targetUserID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid user id")
	}

	if requestingUser.ID != targetUserID {
		log.Error(operation, "err", fiber.ErrForbidden, "reason", "cannot update other user's profile")
		return c.Status(fiber.StatusForbidden).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusForbidden,
			Message:    "forbidden",
		})
	}

	req, ok := utils.GetValidatedBody[dto.UpdateUserRequest](c)
	if !ok {
		log.Error(operation, "err", fiber.ErrBadRequest, "reason", "invalid request body")
		return middleware.BadRequestResponse(c, "invalid request body")
	}

	log.Debug(operation, "executing use case", "userID", targetUserID)
	user, err := h.usersService.UpdateUser(c.Context(), targetUserID, req.Name, req.Lastname)
	if err != nil {
		log.Error(operation, "err", err, "userID", targetUserID)
		return err
	}

	log.Info(operation, "user updated", "userID", targetUserID)
	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[dto.UserResponse]{
		StatusCode: fiber.StatusOK,
		Message:    "user updated",
		Data:       dto.UserFromDomain(user),
	})
}

func (h *UsersHandler) ChangePassword(c fiber.Ctx) error {
	actor, ok := c.Locals(middleware.LocalsKeyClaims).(*models.Actor)
	if !ok || actor == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	var req dto.ChangePasswordRequest
	if err := c.Bind().JSON(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "invalid request body",
		})
	}

	if err := h.passwordUpdater.UpdatePassword(c.Context(), actor.ID, req.OldPassword, req.NewPassword); err != nil {
		return err
	}

	if err := h.usersService.SetMustChangePassword(c.Context(), user.ID, false); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(response.HTTPResponse[bool]{
		StatusCode: fiber.StatusOK,
		Message:    "password changed",
	})
}

// Me handles GET /api/auth/me. It returns the Authula user projection
// for the currently authenticated session, mounted on Fiber so it sits
// in front of Authula's own /me route — whose validateSessionHook is
// never reached because the session plugin's hook is PluginID-scoped
// and Authula's core routes carry no plugin metadata. Reaches the same
// shape (`{ user: { id, email, name } }`) the frontend expects from
// the original Authula endpoint, so the client keeps using `data?.user`.
//
// Reads from Fiber locals populated by the AuthSession middleware; no
// extra DB call.
func (h *UsersHandler) Me(c fiber.Ctx) error {
	const operation = "UsersHandler:Me"
	log.Debug(operation, "request received")

	actor, ok := c.Locals(middleware.LocalsKeyClaims).(*models.Actor)
	if !ok || actor == nil {
		log.Error(operation, "err", fiber.ErrUnauthorized, "reason", "missing actor")
		return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	user, ok := c.Locals(middleware.LocalsKeyUser).(*domain.User)
	if !ok || user == nil {
		log.Error(operation, "err", fiber.ErrUnauthorized, "reason", "missing local user")
		return c.Status(fiber.StatusUnauthorized).JSON(response.HTTPResponse[bool]{
			StatusCode: fiber.StatusUnauthorized,
			Message:    "unauthorized",
		})
	}

	log.Debug(operation, "session resolved", "authulaUserID", actor.ID, "localUserID", user.ID)
	return c.Status(fiber.StatusOK).JSON(map[string]any{
		"user": map[string]any{
			"id":    actor.ID,
			"email": user.Email,
			"name":  user.Name,
		},
	})
}

func (h *UsersHandler) Delete(c fiber.Ctx) error {
	const operation = "UsersHandler:Delete"
	log.Debug(operation, "request received")

	requestingUser, ok := middleware.GetRequestUser(c)
	if !ok {
		log.Error(operation, "err", fiber.ErrUnauthorized)
		return middleware.UnauthorizedResponse(c)
	}

	targetUserID, err := middleware.ParseUUIDParam(c, "id")
	if err != nil {
		log.Error(operation, "err", err, "param", "id")
		return middleware.BadRequestResponse(c, "invalid user id")
	}

	log.Debug(operation, "executing use case", "requestingUserID", requestingUser.ID, "targetUserID", targetUserID)
	if err := h.usersService.SoftDeleteUser(c.Context(), requestingUser.ID, targetUserID); err != nil {
		log.Error(operation, "err", err, "targetUserID", targetUserID)
		return err
	}

	log.Info(operation, "user deleted", "targetUserID", targetUserID)
	return c.SendStatus(fiber.StatusNoContent)
}
