package http

import (
	"errors"

	"github.com/gofiber/fiber/v3"
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

	return fiber.StatusInternalServerError, "internal_error", "internal server error"
}
