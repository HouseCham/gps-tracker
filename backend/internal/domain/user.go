package domain

import (
	"time"

	"github.com/google/uuid"
)

// User represents a registered user in the system.
type User struct {
	ID                 uuid.UUID
	Email              string
	Name               string
	Lastname           string
	Role               UserRole
	MustChangePassword bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// UserRole defines the role a user can have.
type UserRole string

const (
	// UserRoleUser is a standard user with no elevated privileges.
	UserRoleUser UserRole = "user"
	// UserRoleSuperAdmin is a super administrator with full access.
	UserRoleSuperAdmin UserRole = "super_admin"
)
