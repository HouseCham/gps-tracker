package devices

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Repository is the port that the app layer defines and infra implements.
type Repository interface {
	ListForUser(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error)
}
