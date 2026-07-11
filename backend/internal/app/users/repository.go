package users

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Reader exposes read-only lookups for users.
type Reader interface {
	ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error)
	GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
}

// Writer exposes mutation operations on user records.
type Writer interface {
	CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole, mustChangePassword, emailVerified bool) (*domain.User, error)
	UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error)
	SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error
	SoftDeleteUser(ctx context.Context, userID uuid.UUID) error
}

// Counter exposes count/aggregate queries used by bootstrap flows.
type Counter interface {
	CountUsers(ctx context.Context) (int, error)
	HasSuperAdmin(ctx context.Context) (bool, error)
}

// Promoter exposes the super_admin promotion path used by the
// first-user bootstrap flow in GetOrCreate.
type Promoter interface {
	PromoteToSuperAdmin(ctx context.Context, userID uuid.UUID) (*domain.User, error)
}

// Repository is the full set of persistence operations for users.
// It composes Reader + Writer + Counter + Promoter so a single
// implementation (e.g. UsersAdapter) satisfies the whole surface;
// callers that only need a subset should depend on the narrower
// role interface above.
type Repository interface {
	Reader
	Writer
	Counter
	Promoter
}
