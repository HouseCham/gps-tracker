package access

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Service encapsulates per-device access checks. It is consumed by HTTP
// middlewares to gate role-restricted endpoints.
type Service struct {
	repo Repository
}

var roleOrder = map[domain.AccessRole]int{
	domain.AccessRoleViewer: 1,
	domain.AccessRoleEditor: 2,
	domain.AccessRoleOwner:  3,
}

func New(repo Repository) *Service {
	return &Service{repo: repo}
}

// GetRole returns the access role the user has on the device.
// Returns domain.ErrNotFound when the user has no access.
func (s *Service) GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error) {
	return s.repo.GetRole(ctx, userID, deviceID)
}

// RequireRole returns nil if the user has at least the given role on the
// device. Returns domain.ErrNotFound (no access) or domain.ErrForbidden
// (insufficient role) otherwise.
func (s *Service) RequireRole(ctx context.Context, userID, deviceID uuid.UUID, min domain.AccessRole) error {
	role, err := s.GetRole(ctx, userID, deviceID)
	if err != nil {
		return err
	}
	if !RoleSatisfies(role, min) {
		return domain.ErrForbidden
	}
	return nil
}

// RoleSatisfies reports whether `actual` is at least as privileged as `min`.
// Hierarchy: viewer (1) < editor (2) < owner (3).
func RoleSatisfies(actual, min domain.AccessRole) bool {
	return roleOrder[actual] >= roleOrder[min]
}
