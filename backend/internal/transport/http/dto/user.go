package dto

import (
	"time"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type UserResponse struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	Lastname  string    `json:"lastname"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

func UserFromDomain(u *domain.User) UserResponse {
	return UserResponse{
		ID:        u.ID.String(),
		Email:     u.Email,
		Name:      u.Name,
		Lastname:  u.Lastname,
		Role:      string(u.Role),
		CreatedAt: u.CreatedAt,
	}
}

type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"omitempty,min=0,max=100"`
	Lastname string `json:"lastname" validate:"omitempty,min=0,max=100"`
	Role     string `json:"role" validate:"required,user_role"`
}

type UpdateUserRequest struct {
	Name     string `json:"name" validate:"omitempty,min=0,max=100"`
	Lastname string `json:"lastname" validate:"omitempty,min=0,max=100"`
}

type DeviceBasicResponse struct {
	ID           string `json:"id"`
	UuidFirmware string `json:"uuid_firmware"`
	Name         string `json:"name"`
}

type PaginationMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type UserWithDevicesResponse struct {
	UserResponse
	Devices    []DeviceBasicResponse `json:"devices"`
	Pagination PaginationMeta        `json:"pagination"`
}

func DeviceBasicFromDomain(d *domain.Device) DeviceBasicResponse {
	return DeviceBasicResponse{
		ID:           d.ID.String(),
		UuidFirmware: d.UuidFirmware,
		Name:         d.Name,
	}
}
