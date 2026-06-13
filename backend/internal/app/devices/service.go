package devices

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Service struct {
	repo DevicesRepository
}

func DevicesService(repo DevicesRepository) *Service {
	return &Service{repo: repo}
}

// ListMine returns the devices the given user has access to.
// The repository hides the underlying SQL and pgx details.
func (s *Service) ListMine(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error) {
	return s.repo.ListForUser(ctx, userID)
}
