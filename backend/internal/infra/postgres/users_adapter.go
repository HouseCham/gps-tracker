package postgres

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type UsersRepository struct {
	q *Queries
}

func NewUsersRepository(q *Queries) *UsersRepository {
	return &UsersRepository{q: q}
}

func (r *UsersRepository) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	pgUsers, err := r.q.GetUserList(ctx, pgtypeUUID(excludeUserID))
	if err != nil {
		return nil, err
	}
	res := make([]domain.User, len(pgUsers))
	for i, u := range pgUsers {
		res[i] = userFromSqlc(u)
	}
	return res, nil
}

var _ users.Repository = (*UsersRepository)(nil)
