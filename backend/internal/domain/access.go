package domain

import (
	"time"

	"github.com/google/uuid"
)

// Grant represents a per-device access grant. Returned by
// access.Service.Grant and used as the shape of POST /api/v1/devices/:id/access
// responses.
type Grant struct {
	UserID    uuid.UUID
	DeviceID  uuid.UUID
	Role      AccessRole
	CreatedAt time.Time
}

// UserWithAccessOnDevice is the projection used by the device admin panel:
// every user that has (non-deleted) access to a given device, along with
// the role each user holds and when the grant was created.
type UserWithAccessOnDevice struct {
	UserID          uuid.UUID
	Email           string
	AccessRole      AccessRole
	AccessGrantedAt time.Time
}
