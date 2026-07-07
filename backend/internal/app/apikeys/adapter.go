package apikeys

import (
	"context"
	"errors"
	"fmt"
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
	pool *pgxpool.Pool
}

func NewAdapter(pool *pgxpool.Pool) *Adapter {
	return &Adapter{pool: pool}
}

// Create inserts a fresh row. The `token` argument is the opaque
// lookup token the device will send in the X-Device-API-Key header;
// we store it as-is. The column name `key_hash` is legacy; see
// apikeys/service.go for the rationale (no bcrypt per IoT verify).
func (a *Adapter) Create(ctx context.Context, deviceID uuid.UUID, token string) (Key, error) {
	queries := postgres.New(a.pool)
	row, err := queries.CreateAPIKey(ctx, postgres.CreateAPIKeyParams{
		DeviceID:  postgres.PgtypeUUID(deviceID),
		KeyHash:   token,
		ExpiresAt: pgtype.Timestamptz{}, // NULL — no expiration
	})
	if err != nil {
		return Key{}, fmt.Errorf("Adapter.Create: %w", err)
	}
	return toDomainKey(row), nil
}

// Revoke soft-deletes a key by ID. The partial UNIQUE INDEX on
// key_hash WHERE deleted_at IS NULL lets the admin rotate without a
// hash conflict.
func (a *Adapter) Revoke(ctx context.Context, keyID uuid.UUID) error {
	queries := postgres.New(a.pool)
	if err := queries.RevokeAPIKey(ctx, postgres.PgtypeUUID(keyID)); err != nil {
		return fmt.Errorf("Adapter.Revoke: %w", err)
	}
	return nil
}

// GetActiveByToken is the IoT hot path. SQL filters out soft-deleted
// and expired rows; the partial unique index keeps the lookup a single
// index seek. Returns ErrNotFound when no row matches.
func (a *Adapter) GetActiveByToken(ctx context.Context, token string) (Key, error) {
	queries := postgres.New(a.pool)
	row, err := queries.GetActiveKeyByHash(ctx, token)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Key{}, ErrNotFound
		}
		return Key{}, postgres.WrapPgError(err)
	}
	return toDomainKey(row), nil
}

// ListForDevice returns metadata (no token) for every active key on a
// device. Admin UI uses this for the keys panel.
func (a *Adapter) ListForDevice(ctx context.Context, deviceID uuid.UUID) ([]KeyMetadata, error) {
	queries := postgres.New(a.pool)
	rows, err := queries.ListAPIKeysForDevice(ctx, postgres.PgtypeUUID(deviceID))
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
