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
			Name:      r.Name,
			Lastname:  r.Lastname,
			Role:      domain.UserRole(r.Role),
			CreatedAt: r.CreatedAt.Time,
			UpdatedAt: r.UpdatedAt.Time,
		})
	}
	return result, nil
}

func (a *UsersAdapter) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.GetUserByID(ctx, pgtypeUUID(userID))
	if err != nil {
		return nil, wrapPgError(err)
	}
	return &domain.User{
		ID:        uuidFromPgtype(row.ID),
		Email:     row.Email,
		Name:      row.Name,
		Lastname:  row.Lastname,
		Role:      domain.UserRole(row.Role),
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}, nil
}

func (a *UsersAdapter) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.CreateUser(ctx, CreateUserParams{
		Email:    email,
		Name:     name,
		Lastname: lastname,
		Role:     UserRole(role),
	})
	if err != nil {
		return nil, wrapPgError(err)
	}
	return &domain.User{
		ID:        uuidFromPgtype(row.ID),
		Email:     row.Email,
		Name:      row.Name,
		Lastname:  row.Lastname,
		Role:      domain.UserRole(row.Role),
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}, nil
}

func (a *UsersAdapter) CountUsers(ctx context.Context) (int, error) {
	queries := New(a.pool)
	row, err := queries.CountUsers(ctx)
	if err != nil {
		return 0, wrapPgError(err)
	}
	return int(row), nil
}

func (a *UsersAdapter) UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.UpdateUser(ctx, UpdateUserParams{
		ID:       pgtypeUUID(userID),
		Name:     name,
		Lastname: lastname,
	})
	if err != nil {
		return nil, wrapPgError(err)
	}
	return &domain.User{
		ID:        uuidFromPgtype(row.ID),
		Email:     row.Email,
		Name:      row.Name,
		Lastname:  row.Lastname,
		Role:      domain.UserRole(row.Role),
		CreatedAt: row.CreatedAt.Time,
		UpdatedAt: row.UpdatedAt.Time,
	}, nil
}
