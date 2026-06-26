package postgres

import (
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

func pgtypeUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: u, Valid: true}
}

func uuidFromPgtype(p pgtype.UUID) uuid.UUID {
	if !p.Valid {
		return uuid.Nil
	}
	return uuid.UUID(p.Bytes)
}

func timestamptzToPtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}

// toDomainDevice builds a domain.Device from the common device columns.
// Every sqlc row type for the `devices` table shares this projection, so
// the conversion lives in one place.
func toDomainDevice(id pgtype.UUID, uuidFirmware, name string, vehicleType DeviceVehicleType, createdAt, lastSeenAt pgtype.Timestamptz) *domain.Device {
	return &domain.Device{
		ID:           uuidFromPgtype(id),
		UuidFirmware: uuidFirmware,
		Name:         name,
		VehicleType:  domain.DeviceVehicleType(vehicleType),
		CreatedAt:    createdAt.Time,
		LastSeenAt:   timestamptzToPtr(lastSeenAt),
	}
}
