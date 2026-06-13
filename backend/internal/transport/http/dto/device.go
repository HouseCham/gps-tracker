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

type DeviceWithAccessResponse struct {
	DeviceResponse
	AccessRole string `json:"access_role"`
}

func DeviceFromDomain(d *domain.Device) DeviceResponse {
	return DeviceResponse{
		ID:           d.ID.String(),
		UuidFirmware: d.UuidFirmware,
		Name:         d.Name,
		CreatedAt:    d.CreatedAt,
		LastSeenAt:   d.LastSeenAt,
	}
}

func DeviceWithAccessFromDomain(d *domain.DeviceWithAccess) DeviceWithAccessResponse {
	return DeviceWithAccessResponse{
		DeviceResponse: DeviceFromDomain(&d.Device),
		AccessRole:     string(d.AccessRole),
	}
}
