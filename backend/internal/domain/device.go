package domain

import (
	"time"

	"github.com/google/uuid"
)

// Device represents a physical GPS tracking device registered in the system.
type Device struct {
	ID           uuid.UUID
	UuidFirmware string
	Name         string
	CreatedAt    time.Time
	LastSeenAt   *time.Time
}

// DeviceWithAccess pairs a Device with the AccessRole the requesting user has on it.
type DeviceWithAccess struct {
	Device
	AccessRole AccessRole
}

// AccessRole defines the permission level a user has on a device.
type AccessRole string

const (
	// AccessRoleOwner is the highest role, with full control over the device.
	AccessRoleOwner AccessRole = "owner"
	// AccessRoleEditor can modify device settings but cannot delete.
	AccessRoleEditor AccessRole = "editor"
	// AccessRoleViewer has read-only access to the device.
	AccessRoleViewer AccessRole = "viewer"
)
