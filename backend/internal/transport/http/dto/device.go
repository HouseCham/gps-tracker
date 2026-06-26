package dto

import (
	"time"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type DeviceResponse struct {
	ID           string                `json:"id"`
	UuidFirmware string                `json:"uuid_firmware"`
	Name         string                `json:"name"`
	VehicleType  domain.DeviceVehicleType `json:"vehicle_type"`
	CreatedAt    time.Time             `json:"created_at"`
	LastSeenAt   *time.Time            `json:"last_seen_at,omitempty"`
}

type CreateDeviceRequest struct {
	UuidFirmware string `json:"uuid_firmware" validate:"required,uuid"`
	Name         string `json:"name"          validate:"required,min=1,max=255"`
	VehicleType  string `json:"vehicle_type"  validate:"required,oneof=bicycle motorcycle car truck van other"`
}

type UpdateDeviceRequest struct {
	Name        string `json:"name"         validate:"required,min=1,max=255"`
	VehicleType string `json:"vehicle_type" validate:"omitempty,oneof=bicycle motorcycle car truck van other"`
}

type DeviceWithAccessResponse struct {
	DeviceResponse
	AccessRole string `json:"access_role"`
}

type DeviceListResponse struct {
	Items      []DeviceWithAccessResponse `json:"items"`
	Pagination PaginationMeta             `json:"pagination"`
}

// DeviceFromDomain converts a *domain.Device to a DeviceResponse
func DeviceFromDomain(d *domain.Device) DeviceResponse {
	return DeviceResponse{
		ID:           d.ID.String(),
		UuidFirmware: d.UuidFirmware,
		Name:         d.Name,
		VehicleType:  d.VehicleType,
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