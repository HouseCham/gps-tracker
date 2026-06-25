package users

import "context"

type UserCreator interface {
	CreateUserWithPassword(ctx context.Context, name, email, password string) error
}