package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// AccessAdapter implements the access repository using sqlc-generated queries.
type AccessAdapter struct {
	pool *pgxpool.Pool
}

func NewAccessAdapter(pool *pgxpool.Pool) *AccessAdapter {
	return &AccessAdapter{pool: pool}
}

// GetRole returns the role from user_device_access for the (user, device) pair.
// Returns domain.ErrNotFound when the row is absent (no access OR soft-deleted
// grant OR device doesn't exist — caller cannot distinguish).
func (a *AccessAdapter) GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error) {
	queries := New(a.pool)
	row, err := queries.GetDeviceAccess(ctx, GetDeviceAccessParams{
		UserID:   pgtypeUUID(userID),
		DeviceID: pgtypeUUID(deviceID),
	})
	if err != nil {
		return "", wrapPgError(err)
	}
	return domain.AccessRole(row.Role), nil
}
