package devices

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type mockRepo struct {
	listForUserFn                     func(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error)
	listForUserWithAccessPaginatedFn  func(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.DeviceWithAccess, int, error)
	listForUserPaginatedFn            func(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Device, int, error)
	getByIDForUserFn                  func(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error)
	createFn                          func(ctx context.Context, input CreateInput) (*domain.Device, error)
	updateNameFn                      func(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error)
	softDeleteFn                      func(ctx context.Context, deviceID uuid.UUID) error
}

func (m *mockRepo) ListForUser(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error) {
	return m.listForUserFn(ctx, userID)
}
func (m *mockRepo) ListForUserWithAccessPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.DeviceWithAccess, int, error) {
	return m.listForUserWithAccessPaginatedFn(ctx, userID, limit, offset)
}
func (m *mockRepo) ListForUserPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Device, int, error) {
	return m.listForUserPaginatedFn(ctx, userID, limit, offset)
}
func (m *mockRepo) GetByIDForUser(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error) {
	return m.getByIDForUserFn(ctx, userID, deviceID)
}
func (m *mockRepo) Create(ctx context.Context, input CreateInput) (*domain.Device, error) {
	return m.createFn(ctx, input)
}
func (m *mockRepo) UpdateName(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error) {
	return m.updateNameFn(ctx, deviceID, name)
}
func (m *mockRepo) SoftDelete(ctx context.Context, deviceID uuid.UUID) error {
	return m.softDeleteFn(ctx, deviceID)
}

func TestListMine(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()

	t.Run("returns devices for user", func(t *testing.T) {
		expected := []domain.DeviceWithAccess{
			{Device: domain.Device{Name: "tracker-1"}, AccessRole: domain.AccessRoleOwner},
		}
		svc := New(&mockRepo{
			listForUserFn: func(_ context.Context, uid uuid.UUID) ([]domain.DeviceWithAccess, error) {
				if uid != userID {
					t.Errorf("expected userID %v, got %v", userID, uid)
				}
				return expected, nil
			},
		})
		got, err := svc.ListMine(ctx, userID)
		if err != nil {
			t.Fatal(err)
		}
		if len(got) != 1 || got[0].Name != "tracker-1" {
			t.Errorf("got %+v, want %+v", got, expected)
		}
	})

	t.Run("propagates error", func(t *testing.T) {
		svc := New(&mockRepo{
			listForUserFn: func(_ context.Context, _ uuid.UUID) ([]domain.DeviceWithAccess, error) {
				return nil, domain.ErrNotFound
			},
		})
		_, err := svc.ListMine(ctx, userID)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestGetByID(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()
	deviceID := uuid.New()

	t.Run("returns device when user has access", func(t *testing.T) {
		expected := &domain.DeviceWithAccess{
			Device:     domain.Device{ID: deviceID, Name: "gps-1"},
			AccessRole: domain.AccessRoleEditor,
		}
		svc := New(&mockRepo{
			getByIDForUserFn: func(_ context.Context, uid, did uuid.UUID) (*domain.DeviceWithAccess, error) {
				if uid != userID || did != deviceID {
					t.Error("wrong arguments passed to repo")
				}
				return expected, nil
			},
		})
		got, err := svc.GetByID(ctx, userID, deviceID)
		if err != nil {
			t.Fatal(err)
		}
		if got.Name != "gps-1" || got.AccessRole != domain.AccessRoleEditor {
			t.Errorf("got %+v, want %+v", got, expected)
		}
	})

	t.Run("returns nil when no access", func(t *testing.T) {
		svc := New(&mockRepo{
			getByIDForUserFn: func(_ context.Context, _, _ uuid.UUID) (*domain.DeviceWithAccess, error) {
				return nil, domain.ErrNotFound
			},
		})
		_, err := svc.GetByID(ctx, userID, deviceID)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestCreate(t *testing.T) {
	ctx := context.Background()
	input := CreateInput{
		UuidFirmware: "abc-123",
		Name:         "new-device",
		OwnerID:      uuid.New(),
	}

	t.Run("creates and returns device", func(t *testing.T) {
		expected := &domain.Device{Name: "new-device"}
		svc := New(&mockRepo{
			createFn: func(_ context.Context, in CreateInput) (*domain.Device, error) {
				if in != input {
					t.Error("input not forwarded")
				}
				return expected, nil
			},
		})
		got, err := svc.Create(ctx, input)
		if err != nil {
			t.Fatal(err)
		}
		if got.Name != "new-device" {
			t.Errorf("got %+v, want %+v", got, expected)
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		svc := New(&mockRepo{
			createFn: func(_ context.Context, _ CreateInput) (*domain.Device, error) {
				return nil, domain.ErrConflict
			},
		})
		_, err := svc.Create(ctx, input)
		if !errors.Is(err, domain.ErrConflict) {
			t.Errorf("expected ErrConflict, got %v", err)
		}
	})
}

func TestUpdateName(t *testing.T) {
	ctx := context.Background()
	deviceID := uuid.New()

	t.Run("updates and returns device", func(t *testing.T) {
		svc := New(&mockRepo{
			updateNameFn: func(_ context.Context, did uuid.UUID, name string) (*domain.Device, error) {
				if did != deviceID || name != "new-name" {
					t.Error("wrong arguments")
				}
				return &domain.Device{ID: did, Name: name}, nil
			},
		})
		got, err := svc.UpdateName(ctx, deviceID, "new-name")
		if err != nil {
			t.Fatal(err)
		}
		if got.Name != "new-name" {
			t.Errorf("got %s, want new-name", got.Name)
		}
	})

	t.Run("not found on soft-deleted device", func(t *testing.T) {
		svc := New(&mockRepo{
			updateNameFn: func(_ context.Context, _ uuid.UUID, _ string) (*domain.Device, error) {
				return nil, domain.ErrNotFound
			},
		})
		_, err := svc.UpdateName(ctx, deviceID, "new-name")
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestSoftDelete(t *testing.T) {
	ctx := context.Background()
	deviceID := uuid.New()

	t.Run("deletes successfully", func(t *testing.T) {
		svc := New(&mockRepo{
			softDeleteFn: func(_ context.Context, did uuid.UUID) error {
				if did != deviceID {
					t.Error("wrong device id")
				}
				return nil
			},
		})
		if err := svc.SoftDelete(ctx, deviceID); err != nil {
			t.Errorf("expected nil, got %v", err)
		}
	})

	t.Run("idempotent delete succeeds", func(t *testing.T) {
		svc := New(&mockRepo{
			softDeleteFn: func(_ context.Context, _ uuid.UUID) error {
				return nil
			},
		})
		if err := svc.SoftDelete(ctx, deviceID); err != nil {
			t.Errorf("expected nil for idempotent delete, got %v", err)
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		svc := New(&mockRepo{
			softDeleteFn: func(_ context.Context, _ uuid.UUID) error {
				return domain.ErrNotFound
			},
		})
		err := svc.SoftDelete(ctx, deviceID)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}
