package devices

import (
	"context"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// CreateInput carries the data needed to create a device.
// The caller (typically the service) is responsible for business rules;
// the repository handles persistence and the implicit owner access grant.
type CreateInput struct {
	UuidFirmware string
	Name         string
	OwnerID      uuid.UUID
}

// Repository is the port that the app layer defines and infra implements.
type Repository interface {
	ListForUser(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error)
	ListForUserWithAccessPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.DeviceWithAccess, int, error)
	ListForUserPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Device, int, error)
	GetByIDForUser(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error)
	Create(ctx context.Context, input CreateInput) (*domain.Device, error)
	UpdateName(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error)
	SoftDelete(ctx context.Context, deviceID uuid.UUID) error
}
