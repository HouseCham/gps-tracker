package devices

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Service struct {
	repo Repository
}

func DevicesService(repo Repository) *Service {
	return &Service{repo: repo}
}

// ListMine returns the devices the given user has access to.
func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error) {
	return s.repo.ListForUser(ctx, userID)
}

// GetByID returns a single device if the given user has access to it.
// Returns domain.ErrNotFound if the device does not exist OR the user has
// no access (the repository collapses both into "no rows").
func (s *Service) GetByID(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error) {
	return s.repo.GetByIDForUser(ctx, userID, deviceID)
}

// Create registers a new device and grants the caller owner access to it,
// atomically. The repository implementation owns the transaction.
func (s *Service) Create(ctx context.Context, input CreateInput) (*domain.Device, error) {
	return s.repo.Create(ctx, input)
}

// UpdateName renames a device. The caller is responsible for ensuring the
// authenticated user has at least editor access (enforced by HTTP middleware).
// Returns domain.ErrNotFound if the device does not exist or is soft-deleted.
func (s *Service) UpdateName(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error) {
	return s.repo.UpdateName(ctx, deviceID, name)
}

// SoftDelete marks the device as deleted by setting deleted_at = NOW().
// The row is NOT physically removed. The caller is responsible for ensuring
// the authenticated user has owner access (enforced by HTTP middleware).
// Idempotent: re-deleting an already-deleted device succeeds silently.
func (s *Service) SoftDelete(ctx context.Context, deviceID uuid.UUID) error {
	return s.repo.SoftDelete(ctx, deviceID)
}
