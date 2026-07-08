# Device API Keys + Location Ingest — Backend summary for frontend

## API keys (`/api/v1/devices/:id/api-keys`)

| Method | Action | Auth |
|--------|--------|------|
| `POST` | Issue a new key (rotates — revokes previous active key) | Session + owner role |
| `GET` | List active keys for a device | Session + owner role |
| `DELETE` | Revoke a specific key | Session + owner role |

- `POST` returns `{ plain_key, key, created_at }` — `plain_key` is shown **once** on creation.
- Each device has **at most one active key** at a time.
- Header: `X-Device-API-Key: <token>` for IoT requests (see below).

Docs: `backend/docs/api/Devices.md` section "API Keys".

## Location ingest (`POST /api/v1/devices/:uuid_firmware/locations`)

- **Auth:** `X-Device-API-Key` header only (no session cookie).
- Resolves device via `:uuid_firmware` URL param, then verifies the token matches.
- Validates `latitude` ±90°, `longitude` ±180°, `recorded_at` RFC 3339.
- Idempotent: `ON CONFLICT (device_id, recorded_at) DO NOTHING` — safe for ESP32 retries.
- Returns `201 Created` on insert, `200 OK` if duplicate.

### Payload fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `latitude` | float64 | ✅ | ±90° |
| `longitude` | float64 | ✅ | ±180° |
| `recorded_at` | string (RFC 3339) | ✅ | Device timestamp |
| `altitude` | float64 | ❌ | meters, nullable |
| `speed` | float64 | ❌ | m/s, nullable | 
| `accuracy` | float64 | ❌ | meters, nullable |
| `battery_voltage` | float64 | ❌ | Volts, nullable (LiPo health) |
| `signal_strength` | int32 | ❌ | 0–31 (AT+CSQ RSSI), nullable |

Docs: `backend/docs/api/Locations.md`.

## Auth model for IoT

- No bcrypt per verify (impractical at IoT scale).
- Opaque 32-byte base64url tokens stored as-is in `key_hash` column.
- Middleware at `backend/internal/transport/http/middleware/require_device_api_key.go` reads header, resolves `:uuid_firmware` → device_id, looks up active token, stamps `device_id` on context.
- Handler reads device ID from `c.Locals("device_id")`.

Docs: `backend/docs/api/Authentication.md` section "IoT Device Authentication".

## Relevant backend source files

- `backend/internal/app/apikeys/` — service + adapter
- `backend/internal/app/locations/` — service + adapter + range validation
- `backend/internal/transport/http/handlers/{apikeys.go, locations.go}`
- `backend/internal/transport/http/dto/{apikey.go, location.go}` — DTOs with `validate:` tags
- `backend/internal/transport/http/router.go` — route registration
- `backend/cmd/api/main.go` — wiring
