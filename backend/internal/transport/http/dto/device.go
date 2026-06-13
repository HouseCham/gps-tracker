package dto

import (
	"time"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type DeviceResponse struct {
	ID           string     `json:"id"`
	UuidFirmware string     `json:"uuid_firmware"`
	Name         string     `json:"name"`
	CreatedAt    time.Time  `json:"created_at"`
	LastSeenAt   *time.Time `json:"last_seen_at,omitempty"`
}

type CreateDeviceRequest struct {
	UuidFirmware string `json:"uuid_firmware" validate:"required,uuid"`
	Name         string `json:"name"          validate:"required,min=1,max=255"`
}

type DeviceWithAccessResponse struct {
	DeviceResponse
	AccessRole string `json:"access_role"`
}

// DeviceFromDomain converts a *domain.Device to a DeviceResponse
func DeviceFromDomain(d *domain.Device) DeviceResponse {
	return DeviceResponse{
		ID:           d.ID.String(),
		UuidFirmware: d.UuidFirmware,
		Name:         d.Name,
		CreatedAt:    d.CreatedAt,
		LastSeenAt:   d.LastSeenAt,
	}
}
// DeviceWithAccessFromDomain converts a *domain.DeviceWithAccess to a DeviceWithAccessResponse
func DeviceWithAccessFromDomain(d *domain.DeviceWithAccess) DeviceWithAccessResponse {
	return DeviceWithAccessResponse{
		DeviceResponse: DeviceFromDomain(&d.Device),
		AccessRole:     string(d.AccessRole),
	}
}
