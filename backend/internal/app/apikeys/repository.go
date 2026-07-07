package apikeys

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

// Reader is the read port: lookup-by-token + list for the admin UI.
type Reader interface {
	// GetActiveByToken is the IoT auth lookup. Filters out
	// soft-deleted and expired tokens in SQL. Returns ErrNotFound
	// when no row matches.
	GetActiveByToken(ctx context.Context, token string) (Key, error)
	// ListForDevice returns every non-revoked key for a device, for
	// the admin UI. Returns metadata only (no token, no hash).
	ListForDevice(ctx context.Context, deviceID uuid.UUID) ([]KeyMetadata, error)
}

// Writer is the write port: create / revoke.
type Writer interface {
	// Create persists a fresh lookup token bound to a device. The
	// device receives the plain token exactly once; the caller MUST
	// surface it before it is GC'd.
	Create(ctx context.Context, deviceID uuid.UUID, token string) (Key, error)
	// Revoke soft-deletes a key. Idempotent.
	Revoke(ctx context.Context, keyID uuid.UUID) error
}

// Key is the projection of a `device_api_keys` row used by the service.
// The token never travels outside this struct — admin UI gets
// KeyMetadata, middleware gets Key.DeviceID.
type Key struct {
	ID         uuid.UUID
	DeviceID   uuid.UUID
	CreatedAt  time.Time
	LastUsedAt *time.Time
	ExpiresAt  *time.Time
}

// KeyMetadata is what the admin UI sees: no token, no hash, but
// timestamps let the panel render "active / last used" without a join.
type KeyMetadata struct {
	ID         uuid.UUID
	CreatedAt  time.Time
	LastUsedAt *time.Time
	ExpiresAt  *time.Time
}

// Sentinel errors. Handlers translate ErrNotFound / ErrKeyMismatch to a
// uniform 401 envelope (avoid leaking which (token, device) pairs exist).
var (
	ErrNotFound    = errors.New("api key not found")
	ErrKeyMismatch = errors.New("api key does not belong to this device")
)
