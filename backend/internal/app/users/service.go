package users

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// CreateUserResult wraps the created user and the temporary password
// assigned during admin creation.
type CreateUserResult struct {
	User              *domain.User
	TemporaryPassword string
}

type UserService struct {
	repo        Repository
	authCreator auth.UserCreator
}

func NewUserService(repo Repository, authCreator auth.UserCreator) *UserService {
	return &UserService{repo: repo, authCreator: authCreator}
}

func (s *UserService) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	return s.repo.ListUsers(ctx, excludeUserID)
}

func (s *UserService) GetByID(ctx context.Context, requestingUserID, targetUserID uuid.UUID) (*domain.User, error) {
	targetUser, err := s.repo.GetByID(ctx, targetUserID)
	if err != nil {
		return nil, err
	}

	requestingUser, err := s.repo.GetByID(ctx, requestingUserID)
	if err != nil {
		return nil, err
	}

	if requestingUser.Role == domain.UserRoleSuperAdmin {
		return targetUser, nil
	}

	if requestingUserID == targetUserID {
		return targetUser, nil
	}

	return nil, domain.ErrForbidden
}

func (s *UserService) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole) (*CreateUserResult, error) {
	count, err := s.repo.CountUsers(ctx)
	if err != nil {
		return nil, err
	}

	if count == 0 {
		role = domain.UserRoleSuperAdmin
	}

	password, err := generateRandomPassword()
	if err != nil {
		return nil, fmt.Errorf("generate password: %w", err)
	}

	if err := s.authCreator.CreateUserWithPassword(ctx, name, email, password); err != nil {
		return nil, fmt.Errorf("create authula user: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, email, name, lastname, role)
	if err != nil {
		return nil, err
	}

	return &CreateUserResult{User: user, TemporaryPassword: password}, nil
}

// GetOrCreate returns the local user record associated with the given
// email, creating one on the fly if no active record exists. It is
// the entry point used by the HTTP auth middleware to materialise a
// domain.User from a verified Authula JWT.
//
// Policy:
//   - If an active (non-soft-deleted) user with this email exists,
//     it is returned as-is.
//   - Otherwise a new user is created. If the system has no other
//     users, the new user is granted super_admin (preserves the
//     bootstrap invariant); otherwise user.
//   - If creation fails because a soft-deleted user with the same
//     email is still present in the table (the email column is
//     UNIQUE regardless of deleted_at), domain.ErrUnauthorized is
//     returned. This is the "do not resurrect" guard.
//
// The "first user becomes super_admin" rule is intentionally coupled
// to user count rather than to a hard-coded flag: it stays correct
// even if the table is later seeded out-of-band.
func (s *UserService) GetOrCreate(ctx context.Context, email, name string) (*domain.User, error) {
	if email == "" {
		return nil, fmt.Errorf("%w: email is required", domain.ErrUnauthorized)
	}

	existing, err := s.repo.GetByEmail(ctx, email)
	if err == nil {
		return existing, nil
	}
	if !errors.Is(err, domain.ErrNotFound) {
		return nil, err
	}

	count, err := s.repo.CountUsers(ctx)
	if err != nil {
		return nil, err
	}
	role := domain.UserRoleUser
	if count == 0 {
		role = domain.UserRoleSuperAdmin
	}

	created, err := s.repo.CreateUser(ctx, email, name, "", role)
	if err == nil {
		return created, nil
	}
	// A unique-violation on email means a soft-deleted user
	// already owns the address. Surface that as 401 instead of
	// 409: the caller is not "conflicting" with anything they
	// could act on, they were simply bounced.
	if errors.Is(err, domain.ErrConflict) {
		return nil, domain.ErrUnauthorized
	}
	return nil, err
}

func (s *UserService) UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error) {
	return s.repo.UpdateUser(ctx, userID, name, lastname)
}

func (s *UserService) SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error {
	return s.repo.SetMustChangePassword(ctx, userID, mustChange)
}

func (s *UserService) SoftDeleteUser(ctx context.Context, requestingUserID, targetUserID uuid.UUID) error {
	requestingUser, err := s.repo.GetByID(ctx, requestingUserID)
	if err != nil {
		return err
	}

	if requestingUser.Role != domain.UserRoleSuperAdmin && requestingUserID != targetUserID {
		return domain.ErrForbidden
	}

	return s.repo.SoftDeleteUser(ctx, targetUserID)
}

// generateRandomPassword generates a cryptographically random
// 32-character hex string (128 bits of entropy).
func generateRandomPassword() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
