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

// deviceFromSqlc converts a sqlc-generated Device into the domain.Device.
func deviceFromSqlc(d Device) *domain.Device {
	return &domain.Device{
		ID:           uuidFromPgtype(d.ID),
		UuidFirmware: d.UuidFirmware,
		Name:         d.Name,
		CreatedAt:    d.CreatedAt.Time,
		LastSeenAt:   timestamptzToPtr(d.LastSeenAt),
	}
}
