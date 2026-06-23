package httptest

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

type MockDevicesRepository struct {
	Devices       map[uuid.UUID]*domain.Device
	DevicesWithAccess map[uuid.UUID][]domain.DeviceWithAccess
	CreateErr     error
	ListErr       error
	GetErr        error
	UpdateErr     error
	DeleteErr     error
}

func NewMockDevicesRepository() *MockDevicesRepository {
	return &MockDevicesRepository{
		Devices:          make(map[uuid.UUID]*domain.Device),
		DevicesWithAccess: make(map[uuid.UUID][]domain.DeviceWithAccess),
	}
}

func (m *MockDevicesRepository) ListForUser(ctx context.Context, userID uuid.UUID) ([]domain.DeviceWithAccess, error) {
	if m.ListErr != nil {
		return nil, m.ListErr
	}
	return m.DevicesWithAccess[userID], nil
}

func (m *MockDevicesRepository) ListForUserWithAccessPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.DeviceWithAccess, int, error) {
	if m.ListErr != nil {
		return nil, 0, m.ListErr
	}
	devices := m.DevicesWithAccess[userID]
	total := len(devices)
	if offset >= len(devices) {
		return []domain.DeviceWithAccess{}, total, nil
	}
	end := offset + limit
	if end > len(devices) {
		end = len(devices)
	}
	return devices[offset:end], total, nil
}

func (m *MockDevicesRepository) ListForUserPaginated(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Device, int, error) {
	if m.ListErr != nil {
		return nil, 0, m.ListErr
	}
	var result []domain.Device
	for _, d := range m.Devices {
		result = append(result, *d)
	}
	return result, len(result), nil
}

func (m *MockDevicesRepository) GetByIDForUser(ctx context.Context, userID, deviceID uuid.UUID) (*domain.DeviceWithAccess, error) {
	if m.GetErr != nil {
		return nil, m.GetErr
	}
	for _, dwa := range m.DevicesWithAccess[userID] {
		if dwa.ID == deviceID {
			return &dwa, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *MockDevicesRepository) Create(ctx context.Context, input devices.CreateInput) (*domain.Device, error) {
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	device := &domain.Device{
		ID:           uuid.New(),
		UuidFirmware: input.UuidFirmware,
		Name:         input.Name,
		CreatedAt:    time.Now(),
	}
	m.Devices[device.ID] = device
	return device, nil
}

func (m *MockDevicesRepository) UpdateName(ctx context.Context, deviceID uuid.UUID, name string) (*domain.Device, error) {
	if m.UpdateErr != nil {
		return nil, m.UpdateErr
	}
	device, ok := m.Devices[deviceID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	device.Name = name
	return device, nil
}

func (m *MockDevicesRepository) SoftDelete(ctx context.Context, deviceID uuid.UUID) error {
	if m.DeleteErr != nil {
		return m.DeleteErr
	}
	if _, ok := m.Devices[deviceID]; !ok {
		return domain.ErrNotFound
	}
	return nil
}

type MockUsersRepository struct {
	Users         map[uuid.UUID]*domain.User
	UsersByEmail  map[string]*domain.User
	Count         int
	CreateErr     error
	GetErr        error
	UpdateErr     error
	DeleteErr     error
	ListErr       error
	CountErr      error
}

func NewMockUsersRepository() *MockUsersRepository {
	return &MockUsersRepository{
		Users:        make(map[uuid.UUID]*domain.User),
		UsersByEmail: make(map[string]*domain.User),
	}
}

func (m *MockUsersRepository) ListUsers(ctx context.Context, excludeUserID uuid.UUID) ([]domain.User, error) {
	if m.ListErr != nil {
		return nil, m.ListErr
	}
	var result []domain.User
	for _, u := range m.Users {
		if u.ID != excludeUserID {
			result = append(result, *u)
		}
	}
	return result, nil
}

func (m *MockUsersRepository) GetByID(ctx context.Context, userID uuid.UUID) (*domain.User, error) {
	if m.GetErr != nil {
		return nil, m.GetErr
	}
	user, ok := m.Users[userID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return user, nil
}

func (m *MockUsersRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	if m.GetErr != nil {
		return nil, m.GetErr
	}
	user, ok := m.UsersByEmail[email]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return user, nil
}

func (m *MockUsersRepository) CreateUser(ctx context.Context, email, name, lastname string, role domain.UserRole, mustChangePassword bool) (*domain.User, error) {
	if m.CreateErr != nil {
		return nil, m.CreateErr
	}
	user := &domain.User{
		ID:                 uuid.New(),
		Email:              email,
		Name:               name,
		Lastname:           lastname,
		Role:               role,
		MustChangePassword: mustChangePassword,
		CreatedAt:          time.Now(),
	}
	m.Users[user.ID] = user
	m.UsersByEmail[email] = user
	m.Count++
	return user, nil
}

func (m *MockUsersRepository) UpdateUser(ctx context.Context, userID uuid.UUID, name, lastname string) (*domain.User, error) {
	if m.UpdateErr != nil {
		return nil, m.UpdateErr
	}
	user, ok := m.Users[userID]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if name != "" {
		user.Name = name
	}
	if lastname != "" {
		user.Lastname = lastname
	}
	return user, nil
}

func (m *MockUsersRepository) SetMustChangePassword(ctx context.Context, userID uuid.UUID, mustChange bool) error {
	// ponytail: no-op mock
	return nil
}

func (m *MockUsersRepository) SoftDeleteUser(ctx context.Context, userID uuid.UUID) error {
	if m.DeleteErr != nil {
		return m.DeleteErr
	}
	if _, ok := m.Users[userID]; !ok {
		return domain.ErrNotFound
	}
	delete(m.Users, userID)
	return nil
}

func (m *MockUsersRepository) CountUsers(ctx context.Context) (int, error) {
	if m.CountErr != nil {
		return 0, m.CountErr
	}
	return m.Count, nil
}

type MockAccessRepository struct {
	AccessGrants map[string]domain.AccessRole
	Grants       []domain.UserWithAccessOnDevice
	GrantErr     error
	RevokeErr    error
	ListErr      error
	GetRoleErr   error
}

func NewMockAccessRepository() *MockAccessRepository {
	return &MockAccessRepository{
		AccessGrants: make(map[string]domain.AccessRole),
	}
}

func (m *MockAccessRepository) GetRole(ctx context.Context, userID, deviceID uuid.UUID) (domain.AccessRole, error) {
	if m.GetRoleErr != nil {
		return "", m.GetRoleErr
	}
	key := userID.String() + ":" + deviceID.String()
	role, ok := m.AccessGrants[key]
	if !ok {
		return "", domain.ErrNotFound
	}
	return role, nil
}

func (m *MockAccessRepository) Grant(ctx context.Context, userID, deviceID uuid.UUID, role domain.AccessRole) (domain.Grant, error) {
	if m.GrantErr != nil {
		return domain.Grant{}, m.GrantErr
	}
	key := userID.String() + ":" + deviceID.String()
	m.AccessGrants[key] = role
	return domain.Grant{
		UserID:    userID,
		DeviceID:  deviceID,
		Role:      role,
		CreatedAt: time.Now(),
	}, nil
}

func (m *MockAccessRepository) Revoke(ctx context.Context, userID, deviceID uuid.UUID) error {
	if m.RevokeErr != nil {
		return m.RevokeErr
	}
	return nil
}

func (m *MockAccessRepository) ListUsersForDevice(ctx context.Context, deviceID uuid.UUID) ([]domain.UserWithAccessOnDevice, error) {
	if m.ListErr != nil {
		return nil, m.ListErr
	}
	return m.Grants, nil
}

type MockUserCreator struct {
	CreateErr error
}

func (m *MockUserCreator) CreateUserWithPassword(ctx context.Context, name, email, password string) error {
	return m.CreateErr
}