package httptest

import (
	"context"

	"github.com/Authula/authula/models"
)

type TestActor struct {
	ID             string
	Type           models.ActorType
	OrganizationID *string
	Scopes         []string
	Metadata       map[string]any
}

type MockJWTValidator struct {
	Actors map[string]*TestActor
}

func NewMockJWTValidator() *MockJWTValidator {
	return &MockJWTValidator{Actors: make(map[string]*TestActor)}
}

func (m *MockJWTValidator) AddActor(token string, actor *TestActor) {
	m.Actors[token] = actor
}

func (m *MockJWTValidator) ValidateToken(_ context.Context, token string) (*models.Actor, error) {
	actor, ok := m.Actors[token]
	if !ok {
		return nil, nil
	}
	return &models.Actor{
		ID:             actor.ID,
		Type:           actor.Type,
		OrganizationID: actor.OrganizationID,
		Scopes:         actor.Scopes,
		Metadata:       actor.Metadata,
	}, nil
}

type MockUserLookup struct {
	Users map[string]*models.User
}

func NewMockUserLookup() *MockUserLookup {
	return &MockUserLookup{Users: make(map[string]*models.User)}
}

func (m *MockUserLookup) AddUser(authulaID string, user *models.User) {
	m.Users[authulaID] = user
}

func (m *MockUserLookup) GetByID(_ context.Context, id string) (*models.User, error) {
	user, ok := m.Users[id]
	if !ok {
		return nil, ErrUserNotFound
	}
	return user, nil
}

var ErrUserNotFound = &mockError{msg: "user not found"}

type mockError struct {
	msg string
}

func (e *mockError) Error() string {
	return e.msg
}

func (e *mockError) Is(target error) bool {
	return target == ErrUserNotFound
}