package access

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Repository is the port for per-device access management.
// Implementations live in the infra layer (e.g., postgres).
type Repository interface {
	// GetRole returns the access role the user has on the device.
	// Returns domain.ErrNotFound when the user has no access OR the device
	// does not exist (both cases collapse to "no rows").
	GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error)

	// Grant creates (or re-activates) a per-device access grant with the
	// given role. The underlying SQL is idempotent: a re-grant overwrites
	// the existing role and clears any soft-delete.
	Grant(ctx context.Context, userID, deviceID uuid.UUID, role domain.AccessRole) (domain.Grant, error)

	// Revoke soft-deletes the (userID, deviceID) grant. A no-op when the
	// row does not exist or is already soft-deleted.
	Revoke(ctx context.Context, userID, deviceID uuid.UUID) error

	// ListUsersForDevice returns every user that has (non-deleted) access
	// to the given device, with their role and when the grant was created.
	ListUsersForDevice(ctx context.Context, deviceID uuid.UUID) ([]domain.UserWithAccessOnDevice, error)
}
