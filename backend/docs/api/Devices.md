# Devices API Documentation

Base URL: `/api/v1`

## Authentication

All device endpoints require the `X-User-Id` header (UUID format) to identify the requesting user. This is a temporary development middleware and will be replaced with JWT authentication in production.

```
X-User-Id: <uuid>
```

## Response Envelope

All responses follow a consistent envelope format:

```json
{
  "status_code": 200,
  "message": "success message",
  "data": { ... }
}
```

## Common Error Responses

| Status Code | Message | Meaning |
|-------------|---------|---------|
| 400 | `invalid device id` | The `:id` path parameter is not a valid UUID |
| 400 | `invalid request body` | Request body failed validation |
| 401 | `unauthorized` | Missing or invalid `X-User-Id` header |
| 403 | `forbidden` | User does not have the required access role on the device |
| 404 | `not found` | Device does not exist OR user has no access to it (security through obscurity) |
| 409 | `conflict` | A device with the given `uuid_firmware` already exists |
| 422 | `validation error` | Database constraint violation (e.g., foreign key) |

---

## Endpoints

### GET /api/v1/devices

Lists all devices the authenticated user has access to.

**Authorization:** Any authenticated user.

**Request**
```
GET /api/v1/devices
X-User-Id: <uuid>
```

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "devices retrieved",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "uuid_firmware": "esp32-001",
      "name": "Living Room GPS",
      "created_at": "2024-01-15T10:30:00Z",
      "last_seen_at": "2024-06-10T08:45:00Z",
      "access_role": "owner"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "uuid_firmware": "esp32-002",
      "name": "Car Tracker",
      "created_at": "2024-02-20T14:00:00Z",
      "last_seen_at": null,
      "access_role": "editor"
    }
  ]
}
```

**Fields:**
- `id` — Device UUID
- `uuid_firmware` — ESP32 firmware UUID (unique per device)
- `name` — Human-readable device name
- `created_at` — ISO 8601 timestamp when device was registered
- `last_seen_at` — ISO 8601 timestamp of last IoT ping (null if never seen)
- `access_role` — User's role on this device: `owner`, `editor`, or `viewer`

---

### GET /api/v1/devices/:id

Retrieves a single device by ID. Returns 404 if the device does not exist OR the user has no access to it (intentional security through obscurity — avoids revealing whether an ID exists).

**Authorization:** Any authenticated user with at least `viewer` access to the device.

**Request**
```
GET /api/v1/devices/:id
X-User-Id: <uuid>
```

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "device retrieved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid_firmware": "esp32-001",
    "name": "Living Room GPS",
    "created_at": "2024-01-15T10:30:00Z",
    "last_seen_at": "2024-06-10T08:45:00Z"
  }
}
```

**Error Responses**
- `400` — Invalid device ID format
- `401` — Unauthorized
- `404` — Device not found or no access

---

### POST /api/v1/devices

Creates a new device and grants the requesting user `owner` access to it.

**Authorization:** Any authenticated user.

**Request**
```
POST /api/v1/devices
X-User-Id: <uuid>
Content-Type: application/json

{
  "uuid_firmware": "esp32-003",
  "name": "Office Tracker"
}
```

**Fields (request body):**
| Field | Type | Required | Validation |
|-------|------|----------|-------------|
| `uuid_firmware` | string | Yes | Must be a valid UUID format |
| `name` | string | Yes | Min 1 char, max 255 chars |

**Response `201 Created`**
```json
{
  "status_code": 201,
  "message": "device created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "uuid_firmware": "esp32-003",
    "name": "Office Tracker",
    "created_at": "2024-06-14T12:00:00Z",
    "last_seen_at": null
  }
}
```

**Error Responses**
- `400` — Invalid request body or validation failure
- `401` — Unauthorized
- `409` — A device with the given `uuid_firmware` already exists

---

### PUT /api/v1/devices/:id

Updates a device's display name.

**Authorization:** Requires `editor` or `owner` access role on the device.

**Request**
```
PUT /api/v1/devices/:id
X-User-Id: <uuid>
Content-Type: application/json

{
  "name": "New Device Name"
}
```

**Fields (request body):**
| Field | Type | Required | Validation |
|-------|------|----------|-------------|
| `name` | string | Yes | Min 1 char, max 255 chars |

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "device updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid_firmware": "esp32-001",
    "name": "New Device Name",
    "created_at": "2024-01-15T10:30:00Z",
    "last_seen_at": "2024-06-10T08:45:00Z"
  }
}
```

**Error Responses**
- `400` — Invalid device ID or request body
- `401` — Unauthorized
- `403` — User has insufficient access role (needs at least `editor`)
- `404` — Device not found or no access

---

### DELETE /api/v1/devices/:id

Soft-deletes a device by setting `deleted_at = NOW()`. The device row is NOT physically removed. This operation is idempotent — re-deleting an already-deleted device succeeds silently.

**Authorization:** Requires `owner` access role on the device.

**Request**
```
DELETE /api/v1/devices/:id
X-User-Id: <uuid>
```

**Response `204 No Content`**

No response body is returned.

**Error Responses**
- `400` — Invalid device ID
- `401` — Unauthorized
- `403` — User has insufficient access role (needs `owner`)
- `404` — Device not found or no access

---

## Device Access Roles

Each user-device relationship has a role that determines allowed operations:

| Role | Permissions |
|------|-------------|
| `owner` | Full CRUD access — can read, update, delete the device and manage other users' access |
| `editor` | Can read and update the device, but cannot delete or manage access |
| `viewer` | Read-only access to the device |

Role hierarchy: `viewer (1) < editor (2) < owner (3)`

---

## Device Access Management

Device access is managed through the `user_device_access` table. Managing access grants (adding/removing users, changing roles) is handled via dedicated access endpoints (not covered in this document).
