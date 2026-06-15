package httptest

import (
	"net/http"
	"testing"

	"github.com/HouseCham/gps-tracker/backend/internal/domain"
)

func TestHealth(t *testing.T) {
	t.Run("200 - health endpoint returns ok", func(t *testing.T) {
		ta := NewTestApp()

		resp, err := ta.Request("GET", "/health", "", nil)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusOK {
			t.Errorf("expected status 200, got %d", resp.StatusCode)
		}
	})
}

func TestChangePassword(t *testing.T) {
	t.Run("200 - user changes password successfully", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-user", "authula-1", "user@test.com", "User", domain.UserRoleUser)

		body := map[string]string{
			"old_password": "old-password",
			"new_password": "new-password-123",
		}

		resp, err := ta.Request("POST", "/api/v1/auth/change-password", "token-user", body)
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
		if httpResp.Message != "password changed" {
			t.Errorf("expected message 'password changed', got %q", httpResp.Message)
		}
	})

	t.Run("400 - missing old_password", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-user", "authula-1", "user@test.com", "User", domain.UserRoleUser)

		body := map[string]string{
			"new_password": "new-password-123",
		}

		resp, err := ta.Request("POST", "/api/v1/auth/change-password", "token-user", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - missing new_password", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-user", "authula-1", "user@test.com", "User", domain.UserRoleUser)

		body := map[string]string{
			"old_password": "old-password",
		}

		resp, err := ta.Request("POST", "/api/v1/auth/change-password", "token-user", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("400 - new_password too short", func(t *testing.T) {
		ta := NewTestApp()

		ta.SetupUser("token-user", "authula-1", "user@test.com", "User", domain.UserRoleUser)

		body := map[string]string{
			"old_password": "old-password",
			"new_password": "short",
		}

		resp, err := ta.Request("POST", "/api/v1/auth/change-password", "token-user", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("401 - no authorization header", func(t *testing.T) {
		ta := NewTestApp()

		body := map[string]string{
			"old_password": "old-password",
			"new_password": "new-password-123",
		}

		resp, err := ta.Request("POST", "/api/v1/auth/change-password", "", body)
		if err != nil {
			t.Fatalf("request error: %v", err)
		}

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("expected status 401, got %d", resp.StatusCode)
		}
	})
}