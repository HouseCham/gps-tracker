package dto

import "time"

// APIKeyResponse is the body of GET /api/v1/devices/:id/api-keys
// (one element) and of the create endpoint's `data` field — minus the
// `plain_key` that appears only at create time.
type APIKeyResponse struct {
	ID         string     `json:"id"`
	CreatedAt  time.Time  `json:"created_at"`
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	ExpiresAt  *time.Time `json:"expires_at,omitempty"`
}

// CreateAPIKeyResponse is the body of POST /api/v1/devices/:id/api-keys.
// Carries the plain token, returned to the admin exactly once.
// After this response is rendered the backend has no copy of the token.
type CreateAPIKeyResponse struct {
	APIKeyResponse
	PlainKey string `json:"plain_key"`
}
