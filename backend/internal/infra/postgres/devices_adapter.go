package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
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

// GetByIDForUser returns the device only if the user has access (any role).
// Returns domain.ErrNotFound (via wrapPgError) when the device does not
// exist OR the user has no access — both cases collapse to 404.
func (a *DevicesAdapter) GetByIDForUser(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error) {
	queries := New(a.pool)
	row, err := queries.GetDeviceByIDForUser(ctx, GetDeviceByIDForUserParams{
		ID:     pgtypeUUID(deviceID),
		UserID: pgtypeUUID(userID),
	})
	if err != nil {
		return nil, wrapPgError(err)
	}
	return &domain.DeviceWithAccess{
		Device: domain.Device{
			ID:           uuidFromPgtype(row.ID),
			UuidFirmware: row.UuidFirmware,
			Name:         row.Name,
			CreatedAt:    row.CreatedAt.Time,
			LastSeenAt:   timestamptzToPtr(row.LastSeenAt),
		},
		AccessRole: domain.AccessRole(row.AccessRole),
	}, nil
}

// Create registers a new device and grants the caller owner access atomically.
// On unique-constraint violation against uuid_firmware, returns domain.ErrConflict.
func (a *DevicesAdapter) Create(ctx context.Context, input devices.CreateInput) (*domain.Device, error) {
	tx, err := a.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	queries := New(tx)

	device, err := queries.CreateDevice(ctx, CreateDeviceParams{
		UuidFirmware: input.UuidFirmware,
		Name:         input.Name,
	})
	if err != nil {
		return nil, wrapPgError(err)
	}

	_, err = queries.GrantDeviceAccess(ctx, GrantDeviceAccessParams{
		UserID:   pgtypeUUID(input.OwnerID),
		DeviceID: device.ID,
		Role:     string(domain.AccessRoleOwner),
	})
	if err != nil {
		return nil, fmt.Errorf("grant owner access: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	return deviceFromSqlc(device), nil
}

// UpdateName renames a device. The caller is expected to have verified access
// upstream (HTTP middleware). Returns domain.ErrNotFound if the device does
// not exist or is soft-deleted.
func (a *DevicesAdapter) UpdateName(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error) {
	queries := New(a.pool)
	row, err := queries.UpdateDeviceName(ctx, UpdateDeviceNameParams{
		ID:   pgtypeUUID(deviceID),
		Name: name,
	})
	if err != nil {
		return nil, wrapPgError(err)
	}
	return deviceFromSqlc(row), nil
}

// SoftDelete marks the device as deleted by setting deleted_at = NOW().
// The row is NOT physically removed from the table. Idempotent: re-deleting
// an already-deleted device is a no-op (the WHERE clause filters it out).
func (a *DevicesAdapter) SoftDelete(ctx context.Context, deviceID uuid.UUID) error {
	queries := New(a.pool)
	return queries.SoftDeleteDevice(ctx, pgtypeUUID(deviceID))
}

// wrapPgError translates pgx errors into domain errors when possible.
func wrapPgError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			return fmt.Errorf("%w: %s", domain.ErrConflict, pgErr.Detail)
		case "23503": // foreign_key_violation
			return fmt.Errorf("%w: %s", domain.ErrValidation, pgErr.Detail)
		case "23502": // not_null_violation
			return fmt.Errorf("%w: %s", domain.ErrValidation, pgErr.Detail)
		}
	}
	return err
}
