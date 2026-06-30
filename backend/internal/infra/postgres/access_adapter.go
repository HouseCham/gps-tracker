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

// Grant creates (or re-activates) a per-device access grant. The underlying
// SQL is idempotent: a re-grant on an existing (user, device) row overwrites
// the role and clears any soft-delete.
func (a *AccessAdapter) Grant(ctx context.Context, userID, deviceID uuid.UUID, role domain.AccessRole) (domain.Grant, error) {
	queries := New(a.pool)
	row, err := queries.GrantDeviceAccess(ctx, GrantDeviceAccessParams{
		UserID:   pgtypeUUID(userID),
		DeviceID: pgtypeUUID(deviceID),
		Role:     string(role),
	})
	if err != nil {
		return domain.Grant{}, wrapPgError(err)
	}
	return domain.Grant{
		UserID:    uuidFromPgtype(row.UserID),
		DeviceID:  uuidFromPgtype(row.DeviceID),
		Role:      domain.AccessRole(row.Role),
		CreatedAt: row.CreatedAt.Time,
	}, nil
}

// Revoke soft-deletes the (user, device) grant. A no-op when the row does
// not exist or is already soft-deleted — callers are expected to check
// access existence via GetRole first.
func (a *AccessAdapter) Revoke(ctx context.Context, userID, deviceID uuid.UUID) error {
	queries := New(a.pool)
	return queries.RevokeDeviceAccess(ctx, RevokeDeviceAccessParams{
		UserID:   pgtypeUUID(userID),
		DeviceID: pgtypeUUID(deviceID),
	})
}

// ListUsersForDevice returns every user that has (non-deleted) access to
// the device, with their role and when the grant was created.
func (a *AccessAdapter) ListUsersForDevice(ctx context.Context, deviceID uuid.UUID) ([]domain.UserWithAccessOnDevice, error) {
	queries := New(a.pool)
	rows, err := queries.ListUsersForDevice(ctx, pgtypeUUID(deviceID))
	if err != nil {
		return nil, err
	}
	result := make([]domain.UserWithAccessOnDevice, 0, len(rows))
	for _, r := range rows {
		result = append(result, domain.UserWithAccessOnDevice{
			UserID:          uuidFromPgtype(r.ID),
			Name:            r.Name,
			Email:           r.Email,
			AccessRole:      domain.AccessRole(r.AccessRole),
			AccessGrantedAt: r.AccessGrantedAt.Time,
		})
	}
	return result, nil
}
