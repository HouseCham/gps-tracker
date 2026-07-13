package apikeys

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// Lookup-token size: 32 random bytes = 256 bits, encoded as base64url
// (= 43 chars of [A-Za-z0-9_-]). Brute-forcing one token is impossible;
// the single-active-key invariant keeps the surface tiny.
const lookupTokenBytes = 32

// Service implements the application logic for device API keys.
//
// Single-active-key invariant: at most one non-revoked key per device,
// enforced by a partial UNIQUE index on device_api_keys(device_id) WHERE
// deleted_at IS NULL. Create() refuses to issue a second key for a device
// that already has one — rotation must go through Revoke() first.
type Service struct {
	writer Writer
	reader Reader
}

func New(w Writer, r Reader) *Service {
	return &Service{writer: w, reader: r}
}

// CreatedKey bundles the persisted key row with the plain token the
// caller MUST surface to the admin exactly once. After this struct
// goes out of scope the service retains no copy of the token.
type CreatedKey struct {
	Key   Key
	Token string
}

// Create issues a new lookup token for `deviceID`. Refuses when the
// device already has an active key — returns domain.ErrConflict which
// the HTTP layer translates to 409 Conflict. To rotate, the caller
// must Revoke the existing key first and then Create a new one.
//
// The friendly pre-check below covers the common case; on a race
// (two concurrent Create calls) the partial UNIQUE index catches it
// and postgres.WrapPgError translates the 23505 to the same
// domain.ErrConflict.
func (s *Service) Create(ctx context.Context, deviceID uuid.UUID) (*CreatedKey, error) {
	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	if _, err := s.reader.GetActiveByDeviceID(ctx, deviceID); err == nil {
		return nil, fmt.Errorf("Service.Create: device already has an active api key: %w", domain.ErrConflict)
	} else if !errors.Is(err, ErrNotFound) {
		return nil, fmt.Errorf("Service.Create: pre-check: %w", err)
	}

	key, err := s.writer.Create(ctx, deviceID, token)
	if err != nil {
		return nil, fmt.Errorf("Service.Create: %w", err)
	}
	return &CreatedKey{Key: key, Token: token}, nil
}

// Revoke soft-deletes a key by ID. Idempotent.
func (s *Service) Revoke(ctx context.Context, keyID uuid.UUID) error {
	return s.writer.Revoke(ctx, keyID)
}

// ListForDevice returns metadata for every active key on a device.
func (s *Service) ListForDevice(ctx context.Context, deviceID uuid.UUID) ([]KeyMetadata, error) {
	return s.reader.ListForDevice(ctx, deviceID)
}

// Authenticate verifies a token against a specific device:
//
//  1. Look up the exact token in `device_api_keys` (partial unique
//     index keeps the scan tiny — one row or none).
//  2. Confirm key.DeviceID == deviceID. Mismatch is reported as
//     ErrNotFound to avoid leaking which (token, device) pairs exist.
//
// No bcrypt per verify: impractical at IoT scale (~80 ms × 2800
// pings/day × 100 devices). The token IS a 256-bit secret; we treat
// it as opaque and rely on TLS to protect it in transit.
func (s *Service) Authenticate(ctx context.Context, token string, deviceID uuid.UUID) (Key, error) {
	key, err := s.reader.GetActiveByToken(ctx, token)
	if err != nil {
		return Key{}, ErrNotFound
	}
	if key.DeviceID != deviceID {
		return Key{}, ErrKeyMismatch
	}
	return key, nil
}

// generateToken returns 32 random bytes, base64url-encoded (no
// padding, no '+' or '/' — safe to send in headers without escaping).
func generateToken() (string, error) {
	b := make([]byte, lookupTokenBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}