package users

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type mockRepo struct {
	listFn                 func(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error)
	getByIDFn              func(ctx context.Context, userID uuid.UUID) (*domain.User, error)
	getByEmailFn           func(ctx context.Context, email string) (*domain.User, error)
	createUserFn           func(ctx context.Context, email, name, lastname string, role domain.UserRole) (*domain.User, error)
	updateUserFn           func(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error)
	softDeleteUserFn       func(ctx context.Context, userID uuid.UUID) error
	setMustChangePasswordFn func(ctx context.Context, userID uuid.UUID, mustChange bool) error
	countUsersFn           func(ctx context.Context) (int, error)
}

func (m *mockRepo) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	return m.listFn(ctx, excludeUserID)
}

func (m *mockRepo) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	return m.getByIDFn(ctx, userID)
}

func (m *mockRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	return m.getByEmailFn(ctx, email)
}

func (m *mockRepo) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole) (*domain.User, error) {
	return m.createUserFn(ctx, email, name, lastname, role)
}

func (m *mockRepo) UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error) {
	return m.updateUserFn(ctx, userID, name, lastname)
}

func (m *mockRepo) SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error {
	return m.setMustChangePasswordFn(ctx, userID, mustChange)
}

func (m *mockRepo) SoftDeleteUser(ctx context.Context, userID uuid.UUID) error {
	return m.softDeleteUserFn(ctx, userID)
}

func (m *mockRepo) CountUsers(ctx context.Context) (int, error) {
	return m.countUsersFn(ctx)
}

type mockUserCreator struct {
	createFn func(ctx context.Context, name, email, password string) error
}

func (m *mockUserCreator) CreateUserWithPassword(ctx context.Context, name, email, password string) error {
	return m.createFn(ctx, name, email, password)
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
		}, &mockUserCreator{})
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
		}, &mockUserCreator{})
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
		}, &mockUserCreator{})
		_, err := svc.ListUsers(ctx, ownerID)
		if !errors.Is(err, expectedErr) {
			t.Errorf("expected %v, got %v", expectedErr, err)
		}
	})
}

func TestGetByID(t *testing.T) {
	ctx := context.Background()
	superAdminID := uuid.New()
	ownerID := uuid.New()
	targetID := uuid.New()

	superAdmin := &domain.User{ID: superAdminID, Role: domain.UserRoleSuperAdmin}
	owner := &domain.User{ID: ownerID, Role: domain.UserRoleUser}
	target := &domain.User{ID: targetID, Role: domain.UserRoleUser}

	t.Run("super admin can fetch any user", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				switch id {
				case superAdminID:
					return superAdmin, nil
				case targetID:
					return target, nil
				}
				return nil, domain.ErrNotFound
			},
		}, &mockUserCreator{})
		got, err := svc.GetByID(ctx, superAdminID, targetID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != targetID {
			t.Errorf("got user %v, want %v", got.ID, targetID)
		}
	})

	t.Run("user can fetch themselves", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, _ uuid.UUID) (*domain.User, error) {
				return owner, nil
			},
		}, &mockUserCreator{})
		got, err := svc.GetByID(ctx, ownerID, ownerID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != ownerID {
			t.Errorf("got user %v, want %v", got.ID, ownerID)
		}
	})

	t.Run("non-admin fetching another user is forbidden", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				switch id {
				case ownerID:
					return owner, nil
				case targetID:
					return target, nil
				}
				return nil, domain.ErrNotFound
			},
		}, &mockUserCreator{})
		_, err := svc.GetByID(ctx, ownerID, targetID)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("expected ErrForbidden, got %v", err)
		}
	})

	t.Run("propagates target lookup error", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				if id == targetID {
					return nil, domain.ErrNotFound
				}
				return owner, nil
			},
		}, &mockUserCreator{})
		_, err := svc.GetByID(ctx, ownerID, targetID)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("propagates requesting user lookup error", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				if id == ownerID {
					return nil, domain.ErrNotFound
				}
				return target, nil
			},
		}, &mockUserCreator{})
		_, err := svc.GetByID(ctx, ownerID, targetID)
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestGetOrCreate(t *testing.T) {
	ctx := context.Background()

	existing := &domain.User{ID: uuid.New(), Email: "exists@test.com", Role: domain.UserRoleUser}

	t.Run("returns existing user without creating", func(t *testing.T) {
		var created bool
		svc := UsersService(&mockRepo{
			getByEmailFn: func(_ context.Context, email string) (*domain.User, error) {
				if email != existing.Email {
					t.Errorf("repo received %q, want %q", email, existing.Email)
				}
				return existing, nil
			},
			createUserFn: func(_ context.Context, _, _, _ string, _ domain.UserRole) (*domain.User, error) {
				created = true
				return nil, nil
			},
		}, &mockUserCreator{})
		got, err := svc.GetOrCreate(ctx, existing.Email, "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.ID != existing.ID {
			t.Errorf("got %v, want %v", got.ID, existing.ID)
		}
		if created {
			t.Error("expected repository CreateUser NOT to be called")
		}
	})

	t.Run("first user is created with super_admin role", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByEmailFn: func(_ context.Context, _ string) (*domain.User, error) {
				return nil, domain.ErrNotFound
			},
			countUsersFn: func(_ context.Context) (int, error) { return 0, nil },
			createUserFn: func(_ context.Context, email, _, _ string, role domain.UserRole) (*domain.User, error) {
				if role != domain.UserRoleSuperAdmin {
					t.Errorf("repo received role %v, want super_admin", role)
				}
				return &domain.User{ID: uuid.New(), Email: email, Role: role}, nil
			},
		}, &mockUserCreator{})
		got, err := svc.GetOrCreate(ctx, "first@test.com", "First")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Role != domain.UserRoleSuperAdmin {
			t.Errorf("got role %v, want super_admin", got.Role)
		}
	})

	t.Run("subsequent user is created with user role", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByEmailFn: func(_ context.Context, _ string) (*domain.User, error) {
				return nil, domain.ErrNotFound
			},
			countUsersFn: func(_ context.Context) (int, error) { return 5, nil },
			createUserFn: func(_ context.Context, _, _, _ string, role domain.UserRole) (*domain.User, error) {
				if role != domain.UserRoleUser {
					t.Errorf("repo received role %v, want user", role)
				}
				return &domain.User{Role: role}, nil
			},
		}, &mockUserCreator{})
		got, err := svc.GetOrCreate(ctx, "fifth@test.com", "Fifth")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Role != domain.UserRoleUser {
			t.Errorf("got role %v, want user", got.Role)
		}
	})

	t.Run("soft-deleted email surfaces as unauthorized", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByEmailFn: func(_ context.Context, _ string) (*domain.User, error) {
				return nil, domain.ErrNotFound
			},
			countUsersFn: func(_ context.Context) (int, error) { return 3, nil },
			createUserFn: func(_ context.Context, _, _, _ string, _ domain.UserRole) (*domain.User, error) {
				return nil, domain.ErrConflict
			},
		}, &mockUserCreator{})
		_, err := svc.GetOrCreate(ctx, "deleted@test.com", "")
		if !errors.Is(err, domain.ErrUnauthorized) {
			t.Errorf("expected ErrUnauthorized, got %v", err)
		}
	})

	t.Run("empty email is unauthorized", func(t *testing.T) {
		svc := UsersService(&mockRepo{}, &mockUserCreator{})
		_, err := svc.GetOrCreate(ctx, "", "")
		if !errors.Is(err, domain.ErrUnauthorized) {
			t.Errorf("expected ErrUnauthorized, got %v", err)
		}
	})

	t.Run("propagates count error", func(t *testing.T) {
		expected := errors.New("db closed")
		svc := UsersService(&mockRepo{
			getByEmailFn: func(_ context.Context, _ string) (*domain.User, error) {
				return nil, domain.ErrNotFound
			},
			countUsersFn: func(_ context.Context) (int, error) { return 0, expected },
		}, &mockUserCreator{})
		_, err := svc.GetOrCreate(ctx, "a@b.com", "")
		if !errors.Is(err, expected) {
			t.Errorf("expected %v, got %v", expected, err)
		}
	})
}

func TestCreateUser(t *testing.T) {
	ctx := context.Background()

	t.Run("preserves role when users already exist", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 3, nil },
			createUserFn: func(_ context.Context, _, _, _ string, role domain.UserRole) (*domain.User, error) {
				if role != domain.UserRoleUser {
					t.Errorf("repo received role %v, want user", role)
				}
				return &domain.User{Email: "a@b.com", Role: role}, nil
			},
		}, &mockUserCreator{
			createFn: func(_ context.Context, _, _, _ string) error { return nil },
		})
		got, err := svc.CreateUser(ctx, "a@b.com", "A", "B", domain.UserRoleUser)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.User.Role != domain.UserRoleUser {
			t.Errorf("got role %v, want user", got.User.Role)
		}
	})

	t.Run("first registered user is promoted to super admin", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 0, nil },
			createUserFn: func(_ context.Context, _, _, _ string, role domain.UserRole) (*domain.User, error) {
				if role != domain.UserRoleSuperAdmin {
					t.Errorf("repo received role %v, want super_admin", role)
				}
				return &domain.User{Role: role}, nil
			},
		}, &mockUserCreator{
			createFn: func(_ context.Context, _, _, _ string) error { return nil },
		})
		got, err := svc.CreateUser(ctx, "first@system.com", "First", "User", domain.UserRoleUser)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.User.Role != domain.UserRoleSuperAdmin {
			t.Errorf("got role %v, want super_admin", got.User.Role)
		}
	})

	t.Run("propagates count error", func(t *testing.T) {
		expected := errors.New("db closed")
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 0, expected },
		}, &mockUserCreator{})
		_, err := svc.CreateUser(ctx, "a@b.com", "A", "B", domain.UserRoleUser)
		if !errors.Is(err, expected) {
			t.Errorf("expected %v, got %v", expected, err)
		}
	})

	t.Run("propagates auth creator error", func(t *testing.T) {
		expected := errors.New("authula error")
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 1, nil },
		}, &mockUserCreator{
			createFn: func(_ context.Context, _, _, _ string) error { return expected },
		})
		_, err := svc.CreateUser(ctx, "a@b.com", "A", "B", domain.UserRoleUser)
		if err == nil {
			t.Fatal("expected error, got nil")
		}
	})

	t.Run("returns temporary password", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 1, nil },
			createUserFn: func(_ context.Context, _, _, _ string, _ domain.UserRole) (*domain.User, error) {
				return &domain.User{Email: "a@b.com"}, nil
			},
		}, &mockUserCreator{
			createFn: func(_ context.Context, _, _, _ string) error { return nil },
		})
		got, err := svc.CreateUser(ctx, "a@b.com", "A", "B", domain.UserRoleUser)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.TemporaryPassword == "" {
			t.Error("expected non-empty temporary password")
		}
	})

	t.Run("propagates create error", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			countUsersFn: func(_ context.Context) (int, error) { return 1, nil },
			createUserFn: func(_ context.Context, _, _, _ string, _ domain.UserRole) (*domain.User, error) {
				return nil, domain.ErrConflict
			},
		}, &mockUserCreator{
			createFn: func(_ context.Context, _, _, _ string) error { return nil },
		})
		_, err := svc.CreateUser(ctx, "a@b.com", "A", "B", domain.UserRoleUser)
		if !errors.Is(err, domain.ErrConflict) {
			t.Errorf("expected ErrConflict, got %v", err)
		}
	})
}

func TestUpdateUser(t *testing.T) {
	ctx := context.Background()
	userID := uuid.New()

	t.Run("updates and returns user", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			updateUserFn: func(_ context.Context, id uuid.UUID, name, lastname string) (*domain.User, error) {
				if id != userID || name != "New" || lastname != "Name" {
					t.Errorf("repo received %v %q %q, want %v New Name", id, name, lastname, userID)
				}
				return &domain.User{ID: id, Name: name, Lastname: lastname}, nil
			},
		}, &mockUserCreator{})
		got, err := svc.UpdateUser(ctx, userID, "New", "Name")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got.Name != "New" || got.Lastname != "Name" {
			t.Errorf("got %+v, want Name=New Lastname=Name", got)
		}
	})

	t.Run("propagates repository error", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			updateUserFn: func(_ context.Context, _ uuid.UUID, _, _ string) (*domain.User, error) {
				return nil, domain.ErrNotFound
			},
		}, &mockUserCreator{})
		_, err := svc.UpdateUser(ctx, userID, "A", "B")
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestSoftDeleteUser(t *testing.T) {
	ctx := context.Background()
	superAdminID := uuid.New()
	ownerID := uuid.New()
	targetID := uuid.New()

	superAdmin := &domain.User{ID: superAdminID, Role: domain.UserRoleSuperAdmin}
	owner := &domain.User{ID: ownerID, Role: domain.UserRoleUser}
	target := &domain.User{ID: targetID, Role: domain.UserRoleUser}

	t.Run("super admin can delete any user", func(t *testing.T) {
		var deleted bool
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				if id == superAdminID {
					return superAdmin, nil
				}
				return target, nil
			},
			softDeleteUserFn: func(_ context.Context, id uuid.UUID) error {
				if id != targetID {
					t.Errorf("repo received %v, want %v", id, targetID)
				}
				deleted = true
				return nil
			},
		}, &mockUserCreator{})
		if err := svc.SoftDeleteUser(ctx, superAdminID, targetID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !deleted {
			t.Error("expected repository SoftDeleteUser to be called")
		}
	})

	t.Run("user can delete themselves", func(t *testing.T) {
		var deleted bool
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, _ uuid.UUID) (*domain.User, error) {
				return owner, nil
			},
			softDeleteUserFn: func(_ context.Context, id uuid.UUID) error {
				if id != ownerID {
					t.Errorf("repo received %v, want %v", id, ownerID)
				}
				deleted = true
				return nil
			},
		}, &mockUserCreator{})
		if err := svc.SoftDeleteUser(ctx, ownerID, ownerID); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if !deleted {
			t.Error("expected repository SoftDeleteUser to be called")
		}
	})

	t.Run("non-admin deleting another user is forbidden", func(t *testing.T) {
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, id uuid.UUID) (*domain.User, error) {
				if id == ownerID {
					return owner, nil
				}
				return target, nil
			},
			softDeleteUserFn: func(_ context.Context, _ uuid.UUID) error {
				t.Error("repository SoftDeleteUser must not be called on forbidden path")
				return nil
			},
		}, &mockUserCreator{})
		err := svc.SoftDeleteUser(ctx, ownerID, targetID)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("expected ErrForbidden, got %v", err)
		}
	})

	t.Run("propagates requesting user lookup error", func(t *testing.T) {
		expected := errors.New("db closed")
		svc := UsersService(&mockRepo{
			getByIDFn: func(_ context.Context, _ uuid.UUID) (*domain.User, error) {
				return nil, expected
			},
			softDeleteUserFn: func(_ context.Context, _ uuid.UUID) error {
				t.Error("repository SoftDeleteUser must not be called when lookup fails")
				return nil
			},
		}, &mockUserCreator{})
		err := svc.SoftDeleteUser(ctx, ownerID, targetID)
		if !errors.Is(err, expected) {
			t.Errorf("expected %v, got %v", expected, err)
		}
	})
}
