package apikeys

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
)

// fakeStore implements both Writer and Reader with an in-memory map
// so the service can be exercised end-to-end without a DB. The same
// values flow through Create → List → GetActive → Revoke.
type fakeStore struct {
	tokens map[string]Key      // token -> Key
	keys   map[uuid.UUID]Key   // id   -> Key
}

func newFakeStore() *fakeStore {
	return &fakeStore{tokens: map[string]Key{}, keys: map[uuid.UUID]Key{}}
}

func (s *fakeStore) Create(_ context.Context, deviceID uuid.UUID, token string) (Key, error) {
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

func TestCreate_GeneratesUniqueTokens(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	deviceID := uuid.New()
	a, err := svc.Create(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("create A: %v", err)
	}
	b, err := svc.Create(context.Background(), deviceID)
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

func TestCreate_RotatesPriorActive(t *testing.T) {
	store := newFakeStore()
	svc := New(store, store)

	deviceID := uuid.New()
	first, err := svc.Create(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("first create: %v", err)
	}
	second, err := svc.Create(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("second create: %v", err)
	}

	// The prior (first) token must no longer authenticate.
	if _, err := svc.Authenticate(context.Background(), first.Token, deviceID); !errors.Is(err, ErrNotFound) {
		t.Errorf("first token still authenticated after rotation: err=%v", err)
	}
	// The new token works.
	if _, err := svc.Authenticate(context.Background(), second.Token, deviceID); err != nil {
		t.Errorf("second token failed to authenticate: %v", err)
	}

	// Exactly one active key remains for this device.
	list, err := svc.ListForDevice(context.Background(), deviceID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("active keys = %d, want 1 (rotation invariant)", len(list))
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
