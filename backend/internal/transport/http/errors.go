package http

import (
	"errors"

	"github.com/gofiber/fiber/v3"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

func httpErrorHandler(c fiber.Ctx, err error) error {
	status, code, message := mapDomainError(err)
	return c.Status(status).JSON(fiber.Map{
		"error": fiber.Map{
			"code":    code,
			"message": message,
		},
	})
}

func mapDomainError(err error) (status int, code string, message string) {
	if err == nil {
		return fiber.StatusOK, "", ""
	}

	var fe *fiber.Error
	if errors.As(err, &fe) {
		return fe.Code, "fiber_error", fe.Message
	}

	switch {
	case errors.Is(err, domain.ErrNotFound):
		return fiber.StatusNotFound, "not_found", "resource not found"
	case errors.Is(err, domain.ErrUnauthorized):
		return fiber.StatusUnauthorized, "unauthorized", "unauthorized"
	case errors.Is(err, domain.ErrForbidden):
		return fiber.StatusForbidden, "forbidden", "forbidden"
	case errors.Is(err, domain.ErrConflict):
		return fiber.StatusConflict, "conflict", "conflict"
	case errors.Is(err, domain.ErrValidation):
		return fiber.StatusBadRequest, "validation_error", "validation error"
	}

	return fiber.StatusInternalServerError, "internal_error", "internal server error"
}
