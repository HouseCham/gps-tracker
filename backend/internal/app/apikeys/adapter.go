package apikeys

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
)

// Adapter implements both Writer and Reader for device API keys.
// The same sqlc-generated Queries back both interfaces.
type Adapter struct {
	q *postgres.Queries
}

func NewAdapter(pool *pgxpool.Pool) *Adapter {
	return &Adapter{q: postgres.New(pool)}
}

// Create inserts a fresh row. The `token` argument is the opaque
// lookup token the device will send in the X-Device-API-Key header;
// we store it as-is. The column name `key_hash` is legacy; see
// apikeys/service.go for the rationale (no bcrypt per IoT verify).
//
// Errors are routed through postgres.WrapPgError so SQLSTATE 23505
// (the new partial UNIQUE index on device_id) is translated to
// domain.ErrConflict and surfaces as 409 Conflict to the admin UI.
func (a *Adapter) Create(ctx context.Context, deviceID uuid.UUID, token string) (Key, error) {
	row, err := a.q.CreateAPIKey(ctx, postgres.CreateAPIKeyParams{
		DeviceID:  postgres.PgtypeUUID(deviceID),
		KeyHash:   token,
		ExpiresAt: pgtype.Timestamptz{}, // NULL — no expiration
	})
	if err != nil {
		return Key{}, postgres.WrapPgError(err)
	}
	return toDomainKey(row), nil
}

// Revoke soft-deletes a key by ID. Idempotent.
func (a *Adapter) Revoke(ctx context.Context, keyID uuid.UUID) error {
	return postgres.WrapPgError(a.q.RevokeAPIKey(ctx, postgres.PgtypeUUID(keyID)))
}

// GetActiveByToken is the IoT hot path. SQL filters out soft-deleted
// and expired rows; the partial unique index keeps the lookup a single
// index seek. Returns ErrNotFound when no row matches.
func (a *Adapter) GetActiveByToken(ctx context.Context, token string) (Key, error) {
	row, err := a.q.GetActiveKeyByHash(ctx, token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Key{}, ErrNotFound
		}
		return Key{}, postgres.WrapPgError(err)
	}
	return toDomainKey(row), nil
}

// GetActiveByDeviceID is the friendly pre-check used by Service.Create
// before issuing a new key. Returns ErrNotFound when the device has no
// active key; the caller decides whether ErrNotFound is "ok, proceed"
// or "real error". The DB-level partial UNIQUE index is the source of
// truth — this query exists only to keep the common-case error path
// out of SQLSTATE territory.
func (a *Adapter) GetActiveByDeviceID(ctx context.Context, deviceID uuid.UUID) (KeyMetadata, error) {
	row, err := a.q.GetActiveKeyByDeviceID(ctx, postgres.PgtypeUUID(deviceID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return KeyMetadata{}, ErrNotFound
		}
		return KeyMetadata{}, postgres.WrapPgError(err)
	}
	return toDomainKeyMetadata(row), nil
}

// ListForDevice returns metadata (no token) for every active key on a
// device. Admin UI uses this for the keys panel. With the single-active-
// key invariant enforced, this is always 0 or 1 row.
func (a *Adapter) ListForDevice(ctx context.Context, deviceID uuid.UUID) ([]KeyMetadata, error) {
	rows, err := a.q.ListAPIKeysForDevice(ctx, postgres.PgtypeUUID(deviceID))
	if err != nil {
		return nil, postgres.WrapPgError(err)
	}
	out := make([]KeyMetadata, 0, len(rows))
	for _, r := range rows {
		out = append(out, toDomainKeyMetadata(r))
	}
	return out, nil
}

// toDomainKey builds the projection the service uses. We never expose
// the lookup token past this boundary — admin UI gets KeyMetadata,
// middleware gets Key.DeviceID.
func toDomainKey(r postgres.DeviceApiKey) Key {
	return Key{
		ID:         postgres.UuidFromPgtype(r.ID),
		DeviceID:   postgres.UuidFromPgtype(r.DeviceID),
		CreatedAt:  r.CreatedAt.Time,
		LastUsedAt: timestamptzToPtr(r.LastUsedAt),
		ExpiresAt:  timestamptzToPtr(r.ExpiresAt),
	}
}

// toDomainKeyMetadata builds the metadata projection for the admin UI:
// same row, but no device_id field (the caller already knows it).
func toDomainKeyMetadata(r postgres.DeviceApiKey) KeyMetadata {
	return KeyMetadata{
		ID:         postgres.UuidFromPgtype(r.ID),
		CreatedAt:  r.CreatedAt.Time,
		LastUsedAt: timestamptzToPtr(r.LastUsedAt),
		ExpiresAt:  timestamptzToPtr(r.ExpiresAt),
	}
}

// timestamptzToPtr lifts a sqlc pgtype.Timestamptz to *time.Time,
// returning nil when the column is SQL NULL.
func timestamptzToPtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time
	return &v
}