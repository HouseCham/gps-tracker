package httptest

import (
	"context"

	"github.com/Authula/authula/models"
	"github.com/gofiber/fiber/v3"
)

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

type TestActor struct {
	ID             string
	Type           models.ActorType
	OrganizationID *string
	Scopes         []string
	Metadata       map[string]any
}

// MockSessionAuthenticator maps session-cookie values to actors.
// Tests use it in place of the real Authula session service by
// calling AddActor(token, actor) during setup and the middleware
// looks the actor up by cookie value at request time.
type MockSessionAuthenticator struct {
	Actors map[string]*TestActor
}

func NewMockSessionAuthenticator() *MockSessionAuthenticator {
	return &MockSessionAuthenticator{Actors: make(map[string]*TestActor)}
}

func (m *MockSessionAuthenticator) AddActor(token string, actor *TestActor) {
	m.Actors[token] = actor
}

func (m *MockSessionAuthenticator) Authenticate(_ context.Context, sessionToken string) (*models.Actor, error) {
	actor, ok := m.Actors[sessionToken]
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

type MockSessionManager struct {
	InvalidatedTokens map[string]bool
	ClearedCookies    bool
}

func (m *MockSessionManager) Invalidate(_ context.Context, sessionToken string) error {
	if m.InvalidatedTokens == nil {
		m.InvalidatedTokens = make(map[string]bool)
	}
	m.InvalidatedTokens[sessionToken] = true
	return nil
}

func (m *MockSessionManager) ClearCookie(_ fiber.Ctx) {
	m.ClearedCookies = true
}