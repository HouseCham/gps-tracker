package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// DevicesAdapter implements the devices repository using sqlc-generated queries.
type DevicesAdapter struct {
	pool *pgxpool.Pool
}

func NewDevicesAdapter(pool *pgxpool.Pool) *DevicesAdapter {
	return &DevicesAdapter{pool: pool}
}

// ListForUser returns the devices the user has access to, with their access role.
// Filters out soft-deleted devices and soft-deleted access grants.
func (a *DevicesAdapter) ListForUser(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error) {
	queries := New(a.pool)
	rows, err := queries.ListDevicesForUser(ctx, pgtypeUUID(userID))
	if err != nil {
		return nil, err
	}
	result := make([]domain.DeviceWithAccess, 0, len(rows))
	for _, r := range rows {
		result = append(result, domain.DeviceWithAccess{
			Device: domain.Device{
				ID:           uuidFromPgtype(r.ID),
				UuidFirmware: r.UuidFirmware,
				Name:         r.Name,
				CreatedAt:    r.CreatedAt.Time,
				LastSeenAt:   timestamptzToPtr(r.LastSeenAt),
			},
			AccessRole: domain.AccessRole(r.AccessRole),
		})
	}
	return result, nil
}
