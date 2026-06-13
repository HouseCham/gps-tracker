package users

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Repository interface {
	ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error)
}
