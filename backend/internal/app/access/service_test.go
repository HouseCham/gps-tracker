package access

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type mockRepo struct {
	getRoleFn func(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error)
}

func (m *mockRepo) GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error) {
	return m.getRoleFn(ctx, userID, deviceID)
}

func TestRoleSatisfies(t *testing.T) {
	tests := []struct {
		name   string
		actual domain.AccessRole
		min    domain.AccessRole
		want   bool
	}{
		{"owner satisfies viewer", domain.AccessRoleOwner, domain.AccessRoleViewer, true},
		{"owner satisfies editor", domain.AccessRoleOwner, domain.AccessRoleEditor, true},
		{"owner satisfies owner", domain.AccessRoleOwner, domain.AccessRoleOwner, true},
		{"editor satisfies viewer", domain.AccessRoleEditor, domain.AccessRoleViewer, true},
		{"editor satisfies editor", domain.AccessRoleEditor, domain.AccessRoleEditor, true},
		{"editor does not satisfy owner", domain.AccessRoleEditor, domain.AccessRoleOwner, false},
		{"viewer satisfies viewer", domain.AccessRoleViewer, domain.AccessRoleViewer, true},
		{"viewer does not satisfy editor", domain.AccessRoleViewer, domain.AccessRoleEditor, false},
		{"viewer does not satisfy owner", domain.AccessRoleViewer, domain.AccessRoleOwner, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := RoleSatisfies(tt.actual, tt.min); got != tt.want {
				t.Errorf("RoleSatisfies(%q, %q) = %v, want %v", tt.actual, tt.min, got, tt.want)
			}
		})
	}
}

func TestRequireRole(t *testing.T) {
	userID := uuid.New()
	deviceID := uuid.New()
	ctx := context.Background()

	t.Run("allows when role satisfies minimum", func(t *testing.T) {
		svc := New(&mockRepo{
			getRoleFn: func(_ context.Context, _, _ uuid.UUID) (domain.AccessRole, error) {
				return domain.AccessRoleOwner, nil
			},
		})
		err := svc.RequireRole(ctx, userID, deviceID, domain.AccessRoleViewer)
		if err != nil {
			t.Errorf("expected nil, got %v", err)
		}
	})

	t.Run("forbids when role below minimum", func(t *testing.T) {
		svc := New(&mockRepo{
			getRoleFn: func(_ context.Context, _, _ uuid.UUID) (domain.AccessRole, error) {
				return domain.AccessRoleViewer, nil
			},
		})
		err := svc.RequireRole(ctx, userID, deviceID, domain.AccessRoleOwner)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("expected ErrForbidden, got %v", err)
		}
	})

	t.Run("propagates not found from repo", func(t *testing.T) {
		svc := New(&mockRepo{
			getRoleFn: func(_ context.Context, _, _ uuid.UUID) (domain.AccessRole, error) {
				return "", domain.ErrNotFound
			},
		})
		err := svc.RequireRole(ctx, userID, deviceID, domain.AccessRoleViewer)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("propagates unexpected error from repo", func(t *testing.T) {
		unexpected := errors.New("connection refused")
		svc := New(&mockRepo{
			getRoleFn: func(_ context.Context, _, _ uuid.UUID) (domain.AccessRole, error) {
				return "", unexpected
			},
		})
		err := svc.RequireRole(ctx, userID, deviceID, domain.AccessRoleViewer)
		if !errors.Is(err, unexpected) {
			t.Errorf("expected %v, got %v", unexpected, err)
		}
	})
}
