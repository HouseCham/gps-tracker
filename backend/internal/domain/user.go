package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID
	Email     string
	Name      string
	Lastname  string
	Role      UserRole
	CreatedAt time.Time
	UpdatedAt time.Time
}

type UserRole string

const (
	UserRoleUser       UserRole = "user"
	UserRoleSuperAdmin UserRole = "super_admin"
)
