package httptest

import (
	"net/http"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

func TestAccessGrant(t *testing.T) {
	t.Run("201 - owner grants access to device", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		targetID := ta.SetupUser("token-target", "authula-2", "target@test.com", "Target", domain.UserRoleUser)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)

		body := map[string]string{
			"user_id": targetID.String(),
		}

		resp, err := ta.Request("POST", "/api/v1/devices/"+device.ID.String()+"/access", "token-owner", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusCreated {
			t.Errorf("expected status 201, got %d", resp.StatusCode)
		}

		httpResp, err := ParseResponse(resp)
		if err != nil {
			t.Fatalf("parse error: %v", err)
		}
		if httpResp.Message != "access granted" {
			t.Errorf("expected message 'access granted', got %q", httpResp.Message)
		}
	})

	t.Run("403 - non-owner cannot grant access", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		editorID := ta.SetupUser("token-editor", "authula-2", "editor@test.com", "Editor", domain.UserRoleUser)
		targetID := ta.SetupUser("token-target", "authula-3", "target@test.com", "Target", domain.UserRoleUser)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)
		ta.AddDevice(editorID, device, domain.AccessRoleEditor)

		body := map[string]string{
			"user_id": targetID.String(),
		}

		resp, err := ta.Request("POST", "/api/v1/devices/"+device.ID.String()+"/access", "token-editor", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("expected status 403, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - invalid user_id format", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)

		body := map[string]string{
			"user_id": "not-a-uuid",
		}

		resp, err := ta.Request("POST", "/api/v1/devices/"+device.ID.String()+"/access", "token-owner", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("404 - device not found", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		targetID := ta.SetupUser("token-target", "authula-2", "target@test.com", "Target", domain.UserRoleUser)

		_ = ownerID

		body := map[string]string{
			"user_id": targetID.String(),
		}

		nonExistentID := uuid.New()
		resp, err := ta.Request("POST", "/api/v1/devices/"+nonExistentID.String()+"/access", "token-owner", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", resp.StatusCode)
		}
	})

	t.Run("401 - no authorization header", func(t *testing.T) {
		ta := NewTestApp()

		body := map[string]string{
			"user_id": uuid.New().String(),
		}

		deviceID := uuid.New()
		resp, err := ta.Request("POST", "/api/v1/devices/"+deviceID.String()+"/access", "", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", resp.StatusCode)
		}
	})
}

func TestAccessList(t *testing.T) {
	t.Run("200 - owner lists device access", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)

		resp, err := ta.Request("GET", "/api/v1/devices/"+device.ID.String()+"/access", "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}

		httpResp, err := ParseResponse(resp)
		if err != nil {
			t.Fatalf("parse error: %v", err)
		}
		if httpResp.Message != "device access list retrieved" {
			t.Errorf("expected message 'device access list retrieved', got %q", httpResp.Message)
		}
	})

	t.Run("403 - non-owner cannot list device access", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		viewerID := ta.SetupUser("token-viewer", "authula-2", "viewer@test.com", "Viewer", domain.UserRoleUser)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)
		ta.AddDevice(viewerID, device, domain.AccessRoleViewer)

		resp, err := ta.Request("GET", "/api/v1/devices/"+device.ID.String()+"/access", "token-viewer", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("expected status 403, got %d", resp.StatusCode)
		}
	})

	t.Run("404 - device not found", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)

		nonExistentID := uuid.New()
		resp, err := ta.Request("GET", "/api/v1/devices/"+nonExistentID.String()+"/access", "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - invalid device id format", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)

		resp, err := ta.Request("GET", "/api/v1/devices/invalid-uuid/access", "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("401 - no authorization header", func(t *testing.T) {
		ta := NewTestApp()

		deviceID := uuid.New()
		resp, err := ta.Request("GET", "/api/v1/devices/"+deviceID.String()+"/access", "", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", resp.StatusCode)
		}
	})
}

func TestAccessRevoke(t *testing.T) {
	t.Run("204 - owner revokes access", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		viewerID := ta.SetupUser("token-viewer", "authula-2", "viewer@test.com", "Viewer", domain.UserRoleUser)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)
		ta.AddDevice(viewerID, device, domain.AccessRoleViewer)

		resp, err := ta.Request("DELETE", "/api/v1/devices/"+device.ID.String()+"/access/"+viewerID.String(), "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusNoContent {
			t.Errorf("expected status 204, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - owner cannot revoke themselves", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)

		resp, err := ta.Request("DELETE", "/api/v1/devices/"+device.ID.String()+"/access/"+ownerID.String(), "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("403 - non-owner cannot revoke access", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		editorID := ta.SetupUser("token-editor", "authula-2", "editor@test.com", "Editor", domain.UserRoleUser)
		viewerID := ta.SetupUser("token-viewer", "authula-3", "viewer@test.com", "Viewer", domain.UserRoleUser)

		device := &domain.Device{
			ID:           uuid.New(),
			UuidFirmware: "esp32-001",
			Name:         "Test Device",
			CreatedAt:    time.Now(),
		}
		ta.AddDevice(ownerID, device, domain.AccessRoleOwner)
		ta.AddDevice(editorID, device, domain.AccessRoleEditor)
		ta.AddDevice(viewerID, device, domain.AccessRoleViewer)

		resp, err := ta.Request("DELETE", "/api/v1/devices/"+device.ID.String()+"/access/"+viewerID.String(), "token-editor", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("expected status 403, got %d", resp.StatusCode)
		}
	})

	t.Run("404 - device not found", func(t *testing.T) {
		ta := NewTestApp()

		ownerID := ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		viewerID := ta.SetupUser("token-viewer", "authula-2", "viewer@test.com", "Viewer", domain.UserRoleUser)

		_ = ownerID

		nonExistentID := uuid.New()
		resp, err := ta.Request("DELETE", "/api/v1/devices/"+nonExistentID.String()+"/access/"+viewerID.String(), "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("expected status 404, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - invalid device id format", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-owner", "authula-1", "owner@test.com", "Owner", domain.UserRoleSuperAdmin)
		viewerID := uuid.New()

		resp, err := ta.Request("DELETE", "/api/v1/devices/invalid-uuid/access/"+viewerID.String(), "token-owner", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("401 - no authorization header", func(t *testing.T) {
		ta := NewTestApp()

		deviceID := uuid.New()
		userID := uuid.New()
		resp, err := ta.Request("DELETE", "/api/v1/devices/"+deviceID.String()+"/access/"+userID.String(), "", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", resp.StatusCode)
		}
	})
}