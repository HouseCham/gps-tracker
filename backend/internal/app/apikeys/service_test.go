package apikeys

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

// fakeStore implements both Writer and Reader with an in-memory map
// so the service can be exercised end-to-end without a DB. The same
// values flow through Create → List → GetActive → Revoke.
//
// Enforces the same invariant as the real DB: a device can have at
// most one active key. Create returns domain.ErrConflict (via Wrap) on
// collision so the service tests exercise the same code path as prod.
type fakeStore struct {
	tokens map[string]Key      // token -> Key
	keys   map[uuid.UUID]Key   // id   -> Key
}

func newFakeStore() *fakeStore {
	return &fakeStore{tokens: map[string]Key{}, keys: map[uuid.UUID]Key{}}
}

func (s *fakeStore) Create(_ context.Context, deviceID uuid.UUID, token string) (Key, error) {
	if _, ok := s.activeKeyForDevice(deviceID); ok {
		return Key{}, fmt.Errorf("fake: %w", domain.ErrConflict)
	}
	id := uuid.New()
	k := Key{ID: id, DeviceID: deviceID, CreatedAt: time.Now()}
	s.tokens[token] = k
	s.keys[id] = k
	return k, nil
}

func (s *fakeStore) Revoke(_ context.Context, keyID uuid.UUID) error {
	_, ok := s.keys[keyID]
	if !ok {
		return nil // idempotent
	}
	delete(s.keys, keyID)
	for t, v := range s.tokens {
		if v.ID == keyID {
			delete(s.tokens, t)
		}
	}
	return nil
}

func (s *fakeStore) GetActiveByToken(_ context.Context, token string) (Key, error) {
	k, ok := s.tokens[token]
	if !ok {
		return Key{}, ErrNotFound
	}
	return k, nil
}

func (s *fakeStore) GetActiveByDeviceID(_ context.Context, deviceID uuid.UUID) (KeyMetadata, error) {
	k, ok := s.activeKeyForDevice(deviceID)
	if !ok {
		return KeyMetadata{}, ErrNotFound
	}
	return KeyMetadata{ID: k.ID, CreatedAt: k.CreatedAt}, nil
}

func (s *fakeStore) ListForDevice(_ context.Context, deviceID uuid.UUID) ([]KeyMetadata, error) {
	out := make([]KeyMetadata, 0)
	for _, k := range s.keys {
		if k.DeviceID != deviceID {
			continue
		}
		out = append(out, KeyMetadata{ID: k.ID, CreatedAt: k.CreatedAt})
	}
	return out, nil
}

// ListForUser is a stub for the global list. The fake doesn't model
// user-device access, so it returns every active key tagged with a
// placeholder device name -- enough to keep the service test suite
// compilable. End-to-end behavior is covered by integration tests
// against a real Postgres.
func (s *fakeStore) ListForUser(_ context.Context, _ uuid.UUID) ([]KeyWithDevice, error) {
	out := make([]KeyWithDevice, 0, len(s.keys))
	for _, k := range s.keys {
		out = append(out, KeyWithDevice{
			ID:         k.ID,
			DeviceID:   k.DeviceID,
			CreatedAt:  k.CreatedAt,
			DeviceName: "fake-device",
		})
	}
	return out, nil
}

// activeKeyForDevice mirrors the partial UNIQUE index invariant
// (WHERE deleted_at IS NULL). Revoked keys are dropped from s.keys,
// so a simple lookup already implements the soft-delete filter.
func (s *fakeStore) activeKeyForDevice(deviceID uuid.UUID) (Key, bool) {
	for _, k := range s.keys {
		if k.DeviceID == deviceID {
			return k, true
		}
	}
	return Key{}, false
}

func TestCreate_FirstCreateSucceeds(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	created, err := svc.Create(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.Key.ID == uuid.Nil {
		t.Errorf("created key has zero ID")
	}
	if created.Token == "" {
		t.Errorf("created key has empty token")
	}
}

func TestCreate_GeneratesUniqueTokens(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	// Distinct devices per create — same-device now returns ErrConflict.
	a, err := svc.Create(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("create A: %v", err)
	}
	b, err := svc.Create(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("create B: %v", err)
	}
	if a.Token == b.Token {
		t.Errorf("two consecutive creates returned the same token")
	}
	if len(a.Token) < 40 {
		t.Errorf("token suspiciously short: %q (len %d)", a.Token, len(a.Token))
	}
}

func TestCreate_RejectsWhenKeyAlreadyExists(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	deviceID := uuid.New()
	first, err := svc.Create(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("first create: %v", err)
	}
	if _, err := svc.Create(context.Background(), deviceID); err == nil {
		t.Fatalf("second create succeeded; want domain.ErrConflict")
	} else if !errors.Is(err, domain.ErrConflict) {
		t.Errorf("second create err = %v, want errors.Is(domain.ErrConflict)", err)
	}

	// The original token must still authenticate.
	if _, err := svc.Authenticate(context.Background(), first.Token, deviceID); err != nil {
		t.Errorf("first token failed to authenticate: %v", err)
	}

	// Exactly one active key remains for this device.
	list, err := svc.ListForDevice(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("active keys = %d, want 1", len(list))
	}
	if list[0].ID != first.Key.ID {
		t.Errorf("list returned %v, want first key %v", list[0].ID, first.Key.ID)
	}

	// After revoking the original, a new create must succeed.
	if err := svc.Revoke(context.Background(), first.Key.ID); err != nil {
		t.Fatalf("revoke: %v", err)
	}
	third, err := svc.Create(context.Background(), deviceID)
	if err != nil {
		t.Errorf("create after revoke failed: %v", err)
	}
	if third.Token == first.Token {
		t.Errorf("new token matches revoked token")
	}
}

func TestAuthenticate_RejectsTokenForWrongDevice(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	deviceA := uuid.New()
	created, err := svc.Create(context.Background(), deviceA)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	deviceB := uuid.New()
	if _, err := svc.Authenticate(context.Background(), created.Token, deviceB); err == nil {
		t.Errorf("deviceA token authenticated against deviceB")
	}
}

func TestAuthenticate_RejectsUnknownToken(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	if _, err := svc.Authenticate(context.Background(), "not-a-real-token", uuid.New()); !errors.Is(err, ErrNotFound) {
		t.Errorf("got %v want ErrNotFound", err)
	}
}

func TestRevoke_IsIdempotent(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	// Revoking an unknown key is a no-op.
	if err := svc.Revoke(context.Background(), uuid.New()); err != nil {
		t.Errorf("first revoke on unknown id: %v", err)
	}
	// Revoking the same id twice is also a no-op.
	created, err := svc.Create(context.Background(), uuid.New())
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := svc.Revoke(context.Background(), created.Key.ID); err != nil {
		t.Errorf("first revoke: %v", err)
	}
	if err := svc.Revoke(context.Background(), created.Key.ID); err != nil {
		t.Errorf("second revoke: %v", err)
	}
	if _, err := svc.Authenticate(context.Background(), created.Token, created.Key.DeviceID); !errors.Is(err, ErrNotFound) {
		t.Errorf("revoked token still authenticated: err=%v", err)
	}
}