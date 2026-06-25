package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
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
		return nil, wrapPgError(err)
	}
	result := make([]domain.User, 0, len(rows))
	for _, r := range rows {
		result = append(result, rowToDomain(r))
	}
	return result, nil
}

func (a *UsersAdapter) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.GetUserByID(ctx, pgtypeUUID(userID))
	if err != nil {
		return nil, wrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, wrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole, mustChangePassword bool) (*domain.User, error) {
	queries := New(a.pool)
	row, err := queries.CreateUser(ctx, CreateUserParams{
		Email:              email,
		Name:               name,
		Lastname:           lastname,
		Role:               UserRole(role),
		MustChangePassword: mustChangePassword,
	})
	if err != nil {
		return nil, wrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) CountUsers(ctx context.Context) (int, error) {
	queries := New(a.pool)
	row, err := queries.CountUsers(ctx)
	if err != nil {
		return 0, err
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
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error {
	queries := New(a.pool)
	return queries.SetUserMustChangePassword(ctx, SetUserMustChangePasswordParams{
		ID:                 pgtypeUUID(userID),
		MustChangePassword: mustChange,
	})
}

func (a *UsersAdapter) SoftDeleteUser(ctx context.Context, userID uuid.UUID) error {
	queries := New(a.pool)
	return wrapPgError(queries.SoftDeleteUser(ctx, pgtypeUUID(userID)))
}

// rowToDomain maps any sqlc-generated user row (Get/List/Create/Update
// all share the same column shape) to a value-typed domain.User.
func rowToDomain(r any) domain.User {
	switch v := r.(type) {
	case GetUserByIDRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	case GetUserByEmailRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	case GetUserListRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	case CreateUserRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	case UpdateUserRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	}
	return domain.User{}
}

func rowToDomainPtr[T any](r T) *domain.User {
	u := rowToDomain(r)
	return &u
}

func newDomainUser(
	id pgtype.UUID,
	email string,
	emailVerified bool,
	image *string,
	name, lastname string,
	role UserRole,
	mustChangePassword bool,
	createdAt, updatedAt pgtype.Timestamptz,
) domain.User {
	return domain.User{
		ID:                 uuidFromPgtype(id),
		Email:              email,
		EmailVerified:      emailVerified,
		Image:              image,
		Name:               name,
		Lastname:           lastname,
		Role:               domain.UserRole(role),
		MustChangePassword: mustChangePassword,
		CreatedAt:          createdAt.Time,
		UpdatedAt:          updatedAt.Time,
	}
}
