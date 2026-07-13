package postgres

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type UsersAdapter struct {
	pool *pgxpool.Pool
	q    *Queries
}

func NewUsersAdapter(pool *pgxpool.Pool) *UsersAdapter {
	return &UsersAdapter{pool: pool, q: New(pool)}
}

func (a *UsersAdapter) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	rows, err := a.q.GetUserList(ctx, PgtypeUUID(excludeUserID))
	if err != nil {
		return nil, WrapPgError(err)
	}
	result := make([]domain.User, 0, len(rows))
	for _, r := range rows {
		result = append(result, rowToDomain(r))
	}
	return result, nil
}

func (a *UsersAdapter) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	row, err := a.q.GetUserByID(ctx, PgtypeUUID(userID))
	if err != nil {
		return nil, WrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	row, err := a.q.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, WrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole, mustChangePassword, emailVerified bool) (*domain.User, error) {
	row, err := a.q.CreateUser(ctx, CreateUserParams{
		Email:              email,
		Name:               name,
		Lastname:           lastname,
		Role:               UserRole(role),
		MustChangePassword: mustChangePassword,
		EmailVerified:      emailVerified,
	})
	if err != nil {
		return nil, WrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) CountUsers(ctx context.Context) (int, error) {
	row, err := a.q.CountUsers(ctx)
	if err != nil {
		return 0, WrapPgError(err)
	}
	return int(row), nil
}

func (a *UsersAdapter) UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error) {
	row, err := a.q.UpdateUser(ctx, UpdateUserParams{
		ID:       PgtypeUUID(userID),
		Name:     name,
		Lastname: lastname,
	})
	if err != nil {
		return nil, WrapPgError(err)
	}
	return rowToDomainPtr(row), nil
}

func (a *UsersAdapter) SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error {
	return WrapPgError(a.q.SetUserMustChangePassword(ctx, SetUserMustChangePasswordParams{
		ID:                 PgtypeUUID(userID),
		MustChangePassword: mustChange,
	}))
}

func (a *UsersAdapter) SoftDeleteUser(ctx context.Context, userID uuid.UUID) error {
	return WrapPgError(a.q.SoftDeleteUser(ctx, PgtypeUUID(userID)))
}

func (a *UsersAdapter) HasSuperAdmin(ctx context.Context) (bool, error) {
	return a.q.HasSuperAdmin(ctx)
}

func (a *UsersAdapter) PromoteToSuperAdmin(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	row, err := a.q.PromoteToSuperAdmin(ctx, PgtypeUUID(userID))
	if err != nil {
		return nil, WrapPgError(err)
	}
	return rowToDomainPtr(row), nil
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
	case PromoteToSuperAdminRow:
		return newDomainUser(v.ID, v.Email, v.EmailVerified, v.Image, v.Name, v.Lastname, v.Role, v.MustChangePassword, v.CreatedAt, v.UpdatedAt)
	}
	panic(fmt.Sprintf("rowToDomain: unhandled sqlc row type %T", r))
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
		ID:                 UuidFromPgtype(id),
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