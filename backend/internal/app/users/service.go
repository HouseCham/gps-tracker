package users

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	return s.repo.ListUsers(ctx, excludeUserID)
}
