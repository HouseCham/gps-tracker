package users

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Repository interface {
	ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error)
	GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole) (*domain.User, error)
	UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error)
	SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error
	SoftDeleteUser(ctx context.Context, userID uuid.UUID) error
	CountUsers(ctx context.Context) (int, error)
}
