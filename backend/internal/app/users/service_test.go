package users

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type mockRepo struct {
	listFn  func(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error)
	getByIDFn func(ctx context.Context, userID uuid.UUID) (*domain.User, error)
}

func (m *mockRepo) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	return m.listFn(ctx, excludeUserID)
}

func (m *mockRepo) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return m.getByIDFn(ctx, userID)
}

func TestListUsers(t *testing.T) {
	ctx := context.Background()
	ownerID := uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
	user1ID := uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
	user2ID := uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc")

	allUsers := []domain.User{
		{ID: ownerID, Email: "owner@test.com", Role: domain.UserRoleSuperAdmin},
		{ID: user1ID, Email: "user1@test.com", Role: domain.UserRoleUser},
		{ID: user2ID, Email: "user2@test.com", Role: domain.UserRoleUser},
	}

	t.Run("returns all users except excluded ID", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			listFn: func(_ context.Context, exclude uuid.UUID) ([]domain.User, error) {
				if exclude != ownerID {
					t.Errorf("expected exclude %v, got %v", ownerID, exclude)
				}
				return []domain.User{allUsers[1], allUsers[2]}, nil
			},
		})
		got, err := svc.ListUsers(ctx, ownerID)
		if err != nil {
			t.Fatal(err)
		}
		if len(got) != 2 {
			t.Fatalf("expected 2 users, got %d", len(got))
		}
		if got[0].ID != user1ID || got[1].ID != user2ID {
			t.Error("returned wrong users")
		}
	})

	t.Run("returns empty list when only owner exists", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			listFn: func(_ context.Context, _ uuid.UUID) ([]domain.User, error) {
				return []domain.User{}, nil
			},
		})
		got, err := svc.ListUsers(ctx, ownerID)
		if err != nil {
			t.Fatal(err)
		}
		if len(got) != 0 {
			t.Fatalf("expected 0 users, got %d", len(got))
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		expectedErr := errors.New("db closed")
		svc := UsersService(&mockRepo{
			listFn: func(_ context.Context, _ uuid.UUID) ([]domain.User, error) {
				return nil, expectedErr
			},
		})
		_, err := svc.ListUsers(ctx, ownerID)
		if !errors.Is(err, expectedErr) {
			t.Errorf("expected %v, got %v", expectedErr, err)
		}
	})
}
