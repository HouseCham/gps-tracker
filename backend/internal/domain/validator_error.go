package domain

// ValidatorError represents a single field-level validation failure.
type ValidatorError struct {
	// Tag is the validator tag that failed (e.g. "required", "email").
	Tag string
	// Field is the name of the struct field that failed validation.
	Field string
	// Err is the human-readable error message for this field.
	Err string
}
