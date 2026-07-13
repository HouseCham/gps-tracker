package handlers_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"

	"github.com/HouseCham/gps-tracker/backend/internal/app/locations"
	"github.com/HouseCham/gps-tracker/backend/internal/domain"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/dto"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/middleware"
)

type recordingWriter struct {
	calls int
	err   error
}

func (r *recordingWriter) Insert(_ context.Context, _ domain.LocationIngest) error {
	r.calls++
	return r.err
}

// newApp wires just the Ingest endpoint onto a fresh Fiber. The
// production router adds auth + uuid resolution on top, but those
// touch Postgres / Authula and live in their own layers.
func newApp(t *testing.T, svc *locations.Service) *fiber.App {
	t.Helper()
	app := fiber.New()
	devID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	app.Post(
		"/api/v1/devices/:uuid_firmware/locations",
		func(c fiber.Ctx) error {
			// The real middleware stamps c.Locals(device_id) after the
			// API-key lookup. Tests bypass that, so we fabricate the id.
			c.Locals(middleware.LocalsKeyDeviceID, devID)
			return c.Next()
		},
		middleware.ValidateRequestBody[dto.IngestLocationRequest](),
		handlers.NewLocationsHandler(svc).Ingest,
	)
	return app
}

func doRequest(t *testing.T, app *fiber.App, path string, body any) *http.Response {
	t.Helper()
	var r io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		r = bytes.NewReader(b)
	}
	req := httptest.NewRequest(http.MethodPost, path, r)
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	return resp
}

func validBody() map[string]any {
	return map[string]any{
		"recorded_at":     "2026-07-07T12:00:00Z",
		"latitude":        19.43,
		"longitude":       -99.13,
		"altitude":        2240.5,
		"speed":           45.3,
		"accuracy":        4.1,
		"battery_voltage": 3.72,
		"signal_strength": 23,
	}
}

func TestLocationsHandler_AcceptsValid(t *testing.T) {
	stub := &recordingWriter{}
	svc := locations.New(stub)
	app := newApp(t, svc)

	resp := doRequest(t, app, "/api/v1/devices/esp32-001/locations", validBody())
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("status=%d body=%s", resp.StatusCode, body)
	}
	if stub.calls != 1 {
		t.Errorf("writer called %d times, want 1", stub.calls)
	}
}

func TestLocationsHandler_RejectsInvalidLatitude(t *testing.T) {
	stub := &recordingWriter{}
	svc := locations.New(stub)
	app := newApp(t, svc)

	body := validBody()
	body["latitude"] = 200.0
	resp := doRequest(t, app, "/api/v1/devices/esp32-001/locations", body)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status=%d, want 400", resp.StatusCode)
	}
	if stub.calls != 0 {
		t.Errorf("writer called %d times on invalid payload", stub.calls)
	}
}

func TestLocationsHandler_RejectsMissingRecordedAt(t *testing.T) {
	stub := &recordingWriter{}
	svc := locations.New(stub)
	app := newApp(t, svc)

	body := validBody()
	delete(body, "recorded_at")
	resp := doRequest(t, app, "/api/v1/devices/esp32-001/locations", body)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status=%d, want 400 (missing recorded_at)", resp.StatusCode)
	}
}

func TestLocationsHandler_RejectsBadRFC3339(t *testing.T) {
	stub := &recordingWriter{}
	svc := locations.New(stub)
	app := newApp(t, svc)

	body := validBody()
	body["recorded_at"] = "not-a-timestamp"
	resp := doRequest(t, app, "/api/v1/devices/esp32-001/locations", body)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("status=%d, want 400 (bad RFC3339)", resp.StatusCode)
	}
}

func TestLocationsHandler_AcceptsNilOptionalFields(t *testing.T) {
	stub := &recordingWriter{}
	svc := locations.New(stub)
	app := newApp(t, svc)

	body := map[string]any{
		"recorded_at": "2026-07-07T12:00:00Z",
		"latitude":    19.43,
		"longitude":   -99.13,
		// altitude, speed, accuracy, battery_voltage, signal_strength: absent
	}
	resp := doRequest(t, app, "/api/v1/devices/esp32-001/locations", body)
	if resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		t.Errorf("status=%d body=%s want 201", resp.StatusCode, body)
	}
}

// _ keeps the time package in the test if anyone wants to add a
// recordedAt assertion later.
var _ = time.Now
