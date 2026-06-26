package middleware

import (
	"github.com/HouseCham/gps-tracker/backend/internal/config"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/response"
	"github.com/HouseCham/gps-tracker/backend/utils"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

var validator_ *validator.Validate

func init() {
	validator_ = config.SetUpValidator()
	log.Info("Validator is set up")
}

// ValidateRequestBody parses, validates, and stores the request body in the
// Fiber context under LocalsKeyValidatedBody. On failure, it short-circuits
// with an HTTPResponse containing the list of field errors.
func ValidateRequestBody[T any]() fiber.Handler {
	return func(c fiber.Ctx) error {
		var request T
		if err := c.Bind().JSON(&request); err != nil {
			log.Warnf("Failed to parse request body: %v", err)
			return c.Status(fiber.StatusBadRequest).JSON(response.HTTPResponse[bool]{
				StatusCode: fiber.StatusBadRequest,
				Message:    "Error parsing request body",
			})
		}

		response, err := utils.ValidateStruct(request, validator_)
		if err != nil {
			log.Warnf("Invalid request body: %v", response.Data)
			return c.Status(response.StatusCode).JSON(response)
		}

		c.Locals(LocalsKeyValidatedBody, request)
		return c.Next()
	}
}
