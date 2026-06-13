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

// Create registers a new device and grants the caller owner access to it,
// atomically. The repository implementation owns the transaction.
func (s *Service) Create(ctx context.Context, input CreateInput) (*domain.Device, error) {
	return s.repo.Create(ctx, input)
}
