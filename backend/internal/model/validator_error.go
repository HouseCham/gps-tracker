package model

// ValidatorError represents a single field-level validation failure.
type ValidatorError struct {
	Tag   string
	Field string
	Err   string
}
