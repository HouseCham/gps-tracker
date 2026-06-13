package domain

import (
	"time"

	"github.com/google/uuid"
)

type Device struct {
	ID           uuid.UUID
	UuidFirmware string
	Name         string
	CreatedAt    time.Time
	LastSeenAt   *time.Time
}

type DeviceWithAccess struct {
	Device
	AccessRole AccessRole
}

type AccessRole string

const (
	AccessRoleOwner  AccessRole = "owner"
	AccessRoleEditor AccessRole = "editor"
	AccessRoleViewer AccessRole = "viewer"
)
