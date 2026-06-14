package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type UsersAdapter struct {
	pool *pgxpool.Pool
}

func NewUsersAdapter(pool *pgxpool.Pool) *UsersAdapter {
	return &UsersAdapter{pool: pool}
}

func (a *UsersAdapter) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	queries := New(a.pool)
	rows, err := queries.GetUserList(ctx, pgtypeUUID(excludeUserID))
	if err != nil {
		return nil, err
	}
	result := make([]domain.User, 0, len(rows))
	for _, r := range rows {
		result = append(result, domain.User{
			ID:        uuidFromPgtype(r.ID),
			Email:     r.Email,
			Role:      domain.UserRole(r.Role),
			CreatedAt: r.CreatedAt.Time,
			UpdatedAt: r.UpdatedAt.Time,
		})
	}
	return result, nil
}
