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

// APIKeyWithDeviceResponse is the body of GET /api/v1/api-keys —
// the global admin listing that joins device_api_keys with devices
// so the table can render the Device column without a second
// round-trip per row.
//
// `name` and `device_name` both carry the device display name. The
// two fields are intentional: `name` is what the row projects at a
// glance, `device_name` makes the join explicit for clients that want
// to reason about the relation. `device_id` is the owning device's
// UUID and is required by the per-row revoke flow
// (`DELETE /api/v1/devices/:id/api-keys/:keyId`).
type APIKeyWithDeviceResponse struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	DeviceName string    `json:"device_name"`
	DeviceID   string    `json:"device_id"`
	CreatedAt  time.Time `json:"created_at"`
}
