package utils

import (
	"github.com/HouseCham/gps-tracker/backend/internal/config"
	"github.com/HouseCham/gps-tracker/backend/internal/model"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
)

// GetValidatedBody retrieves the validated body previously stored in the
// Fiber context by the ValidateRequestBody middleware.
func GetValidatedBody[T any](c fiber.Ctx) (T, bool) {
	v, ok := c.Locals("validated_body").(T)
	return v, ok
}

// ReturnBadRequestResponse builds a uniform validation error response.
func ReturnBadRequestResponse(errors *[]model.ValidatorError) model.HTTPResponse[[]model.ValidatorError] {
	return model.HTTPResponse[[]model.ValidatorError]{
		StatusCode: fiber.StatusBadRequest,
		Message:    "Invalid request body",
		Data:       *errors,
	}
}

// ValidateStruct runs the validator on the given value. On failure, returns
// a populated HTTPResponse with the list of field errors and the original
// validator error. On success, returns an empty response and nil.
func ValidateStruct(requestBody any, validator *validator.Validate) (model.HTTPResponse[[]model.ValidatorError], error) {
	if err := validator.Struct(requestBody); err != nil {
		return model.HTTPResponse[[]model.ValidatorError]{
			StatusCode: fiber.StatusBadRequest,
			Message:    "Invalid request body",
			Data:       config.GetValidatorErrorMessage(err),
		}, err
	}
	return model.HTTPResponse[[]model.ValidatorError]{}, nil
}
