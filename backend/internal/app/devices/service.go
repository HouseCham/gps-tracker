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
