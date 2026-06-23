package ports

import (
	"context"

	"github.com/Authula/authula/models"
)

type JWTValidator interface {
	ValidateToken(ctx context.Context, token string) (*models.Actor, error)
}

type UserLookup interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
}

type PasswordUpdater interface {
	UpdatePassword(ctx context.Context, authulaUserID, oldPassword, newPassword string) error
}