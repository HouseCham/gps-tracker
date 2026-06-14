package users

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Service struct {
	repo Repository
}

func UsersService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	return s.repo.ListUsers(ctx, excludeUserID)
}

func (s *Service) GetByID(ctx context.Context, requestingUserID, targetUserID uuid.UUID) (*domain.User, error) {
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

func (s *Service) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole) (*domain.User, error) {
	count, err := s.repo.CountUsers(ctx)
	if err != nil {
		return nil, err
	}

	if count == 0 {
		role = domain.UserRoleSuperAdmin
	}

	return s.repo.CreateUser(ctx, email, name, lastname, role)
}
