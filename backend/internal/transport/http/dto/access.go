package dto

import "time"

// GrantAccessRequest is the body of POST /api/v1/devices/:id/access.
// The role is always `viewer` (owner transfer is not supported); the field
// is omitted from the body on purpose.
type GrantAccessRequest struct {
	UserID string `json:"user_id" validate:"required,uuid"`
}

// GrantAccessResponse is the body of a successful POST /api/v1/devices/:id/access.
type GrantAccessResponse struct {
	UserID    string    `json:"user_id"`
	DeviceID  string    `json:"device_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

// UserAccessOnDeviceResponse is one element of the response body of
// GET /api/v1/devices/:id/access and the embedded `users[]` of
// GET /api/v1/devices/:id.
type UserAccessOnDeviceResponse struct {
	UserID          string    `json:"user_id"`
	Name            string    `json:"name"`
	Email           string    `json:"email"`
	Role            string    `json:"role"`
	AccessGrantedAt time.Time `json:"access_granted_at"`
}
