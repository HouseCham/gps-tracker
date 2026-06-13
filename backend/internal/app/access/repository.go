package access

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Repository is the port for per-device access checks.
// Implementations live in the infra layer (e.g., postgres).
type Repository interface {
	// GetRole returns the access role the user has on the device.
	// Returns domain.ErrNotFound when the user has no access OR the device
	// does not exist (both cases collapse to "no rows").
	GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error)
}
