package domain

import "errors"

var (
	// ErrNotFound is returned when a requested resource does not exist.
	ErrNotFound = errors.New("not found")
	// ErrUnauthorized is returned when the request lacks valid authentication.
	ErrUnauthorized = errors.New("unauthorized")
	// ErrForbidden is returned when the authenticated user lacks permission.
	ErrForbidden = errors.New("forbidden")
	// ErrConflict is returned when a resource already exists (e.g. duplicate).
	ErrConflict = errors.New("conflict")
	// ErrValidation is returned when request data fails validation.
	ErrValidation = errors.New("validation error")
	// ErrInvalidCredentials is returned when authentication credentials are invalid.
	ErrInvalidCredentials = errors.New("invalid credentials")
)
