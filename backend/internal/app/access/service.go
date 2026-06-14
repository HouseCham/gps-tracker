package access

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Service encapsulates per-device access checks and grants. It is consumed
// by HTTP middlewares to gate role-restricted endpoints and by the access
// HTTP handler to manage grants.
type Service struct {
	repo  Repository
	users users.Repository
}

// AccessService constructs the access service.
//
// The users repository is needed so the service can validate that a target
// user exists and is not soft-deleted before creating a grant for them.
// Without this, an invalid user_id would surface as a 23503 foreign-key
// violation (422 validation error) instead of the expected 404.
func AccessService(repo Repository, usersRepo users.Repository) *Service {
	return &Service{repo: repo, users: usersRepo}
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
	order := map[domain.AccessRole]int{
		domain.AccessRoleViewer: 1,
		domain.AccessRoleEditor: 2,
		domain.AccessRoleOwner:  3,
	}
	return order[actual] >= order[min]
}

// GrantAccess grants the target user `viewer` access to the device. The
// actor is expected to have been authorized upstream (the HTTP middleware
// asserts the actor is an owner).
//
// Business rules:
//   - The target user must exist and not be soft-deleted, otherwise
//     domain.ErrNotFound is returned.
//   - The granted role is always `viewer`. Ownership transfer is not
//     supported — the device creator remains the sole owner.
//   - The grant is idempotent at the SQL level; re-granting an existing
//     user just overwrites the role (downgrading from a hypothetical
//     future `editor` grant is harmless given current rules).
func (s *Service) GrantAccess(ctx context.Context, actorID, deviceID, targetUserID uuid.UUID) (domain.Grant, error) {
	if actorID == targetUserID {
		return domain.Grant{}, domain.ErrConflict
	}

	if _, err := s.users.GetByID(ctx, targetUserID); err != nil {
		return domain.Grant{}, err
	}

	return s.repo.Grant(ctx, targetUserID, deviceID, domain.AccessRoleViewer)
}

// RevokeAccess revokes the target user's access to the device. The actor
// is expected to have been authorized upstream (the HTTP middleware asserts
// the actor is an owner).
//
// Business rules:
//   - The actor cannot revoke themselves (returns domain.ErrCannotRevokeSelf,
//     which the HTTP layer maps to 400). This guarantees that a device
//     always has at least one owner as long as the creator is active.
//   - The target cannot be another owner (returns domain.ErrForbidden).
//   - Revoking a user with no existing grant returns domain.ErrNotFound.
func (s *Service) RevokeAccess(ctx context.Context, actorID, deviceID, targetUserID uuid.UUID) error {
	if actorID == targetUserID {
		return domain.ErrCannotRevokeSelf
	}

	role, err := s.repo.GetRole(ctx, targetUserID, deviceID)
	if err != nil {
		return err
	}
	if role == domain.AccessRoleOwner {
		return domain.ErrForbidden
	}

	return s.repo.Revoke(ctx, targetUserID, deviceID)
}

// ListUsersForDevice returns every user that has access to the device. The
// actor is expected to have been authorized upstream (the HTTP middleware
// asserts the actor is an owner).
func (s *Service) ListUsersForDevice(ctx context.Context, _, deviceID uuid.UUID) ([]domain.UserWithAccessOnDevice, error) {
	return s.repo.ListUsersForDevice(ctx, deviceID)
}
