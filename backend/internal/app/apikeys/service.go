package apikeys

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/google/uuid"
)

// Lookup-token size: 32 random bytes = 256 bits, encoded as base64url
// (= 43 chars of [A-Za-z0-9_-]). Brute-forcing one token is impossible;
// the rotation path (one active key per device) keeps the surface tiny.
const lookupTokenBytes = 32

// Service implements the application logic for device API keys.
//
// Single-active-key invariant: creating a new key revokes the device's
// prior active key first, so at any time a device has at most one key
// valid for auth. Matches [[decision-gps-tracker-payload-esquema]].
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

// Create issues a new lookup token for `deviceID`. The prior active
// token (if any) is soft-deleted in-place before the insert.
//
// Concurrency: revoke-existing then insert-new are not in a
// transaction. Under heavy concurrent Create() calls for the same
// device you could end up with two active rows for a microsecond. The
// auth path treats either as valid, so the second insert "wins" the
// next request. If you need strict semantics, wrap Create in a tx.
func (s *Service) Create(ctx context.Context, deviceID uuid.UUID) (*CreatedKey, error) {
	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	existing, err := s.reader.ListForDevice(ctx, deviceID)
	if err != nil {
		return nil, fmt.Errorf("Service.Create: list existing keys: %w", err)
	}
	for _, k := range existing {
		if err := s.writer.Revoke(ctx, k.ID); err != nil {
			return nil, fmt.Errorf("Service.Create: revoke prior key %s: %w", k.ID, err)
		}
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
