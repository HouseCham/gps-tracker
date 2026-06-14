# Users API Documentation

Base URL: `/api/v1`

## Authentication

All user endpoints require the `X-User-Id` header (UUID format) to identify the requesting user. Optionally, `X-User-Role` can be used to override the user's role (for development/testing).

```
X-User-Id: <uuid>
X-User-Role: user|super_admin   # optional, defaults to "user"
```

> **Note:** This is a temporary development middleware. In production, authentication will be handled via JWT tokens through the Authula middleware.

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
| 400 | `invalid user id` | The `:id` path parameter is not a valid UUID |
| 400 | `invalid request body` | Request body failed validation |
| 401 | `unauthorized` | Missing or invalid `X-User-Id` header |
| 403 | `forbidden` | User does not have permission to perform this action |
| 404 | `not found` | User does not exist |
| 409 | `conflict` | Email already exists (unique constraint violation) |
| 422 | `validation error` | Database constraint violation |

---

## User Roles

| Role | Description |
|------|-------------|
| `user` | Standard user — can only access/modify their own profile |
| `super_admin` | Administrator — can list all users, create users, and delete any user |

Role hierarchy: `user (1) < super_admin (2)`

---

## Endpoints

### GET /api/v1/users

Lists all users in the system except the requesting user.

**Authorization:** Requires `super_admin` role.

**Request**
```
GET /api/v1/users
X-User-Id: <uuid>
X-User-Role: super_admin
```

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "users retrieved",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "name": "John",
      "lastname": "Doe",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "jane@example.com",
      "name": "Jane",
      "lastname": "Smith",
      "role": "user",
      "created_at": "2024-02-20T14:00:00Z"
    }
  ]
}
```

**Fields:**
- `id` — User UUID
- `email` — User's email address (unique)
- `name` — User's first name (optional, may be empty string)
- `lastname` — User's last name (optional, may be empty string)
- `role` — User's role: `user` or `super_admin`
- `created_at` — ISO 8601 timestamp when user was created

**Error Responses**
- `401` — Unauthorized
- `403` — Forbidden (user is not `super_admin`)

---

### GET /api/v1/users/:id

Retrieves a single user by ID, including a paginated list of their devices.

**Authorization:**
- `super_admin` — can access any user
- Same user ID as the requesting user — can access their own profile
- Otherwise → 403 Forbidden

**Request**
```
GET /api/v1/users/:id?page=1&page_size=10
X-User-Id: <uuid>
X-User-Role: super_admin   # optional depending on target user
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number (1-indexed) |
| `page_size` | int | 10 | Number of devices per page (max 100) |

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "user retrieved",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John",
    "lastname": "Doe",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z",
    "devices": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "uuid_firmware": "esp32-001",
        "name": "Living Room GPS"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

**Fields (data):**
- `id` — User UUID
- `email` — User's email address
- `name` — User's first name
- `lastname` — User's last name
- `role` — User's role
- `created_at` — ISO 8601 timestamp
- `devices` — Array of devices the user has access to
- `pagination` — Pagination metadata

**Fields (devices[ ]):**
- `id` — Device UUID
- `uuid_firmware` — ESP32 firmware UUID
- `name` — Device display name

**Fields (pagination):**
- `page` — Current page number
- `page_size` — Items per page
- `total` — Total number of devices
- `total_pages` — Total number of pages

**Error Responses**
- `400` — Invalid user ID format
- `401` — Unauthorized
- `403` — Forbidden (not the user themselves and not a super_admin)
- `404` — User not found

---

### POST /api/v1/users

Creates a new user account.

**Authorization:** Requires `super_admin` role.

**Request**
```
POST /api/v1/users
X-User-Id: <uuid>
X-User-Role: super_admin
Content-Type: application/json

{
  "email": "newuser@example.com",
  "name": "New",
  "lastname": "User",
  "role": "user"
}
```

**Fields (request body):**
| Field | Type | Required | Validation |
|-------|------|----------|-------------|
| `email` | string | Yes | Must be a valid email address |
| `name` | string | No | Max 100 characters |
| `lastname` | string | No | Max 100 characters |
| `role` | string | Yes | Must be `user` or `super_admin` |

**Response `201 Created`**
```json
{
  "status_code": 201,
  "message": "user created",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "newuser@example.com",
    "name": "New",
    "lastname": "User",
    "role": "user",
    "created_at": "2024-06-14T12:00:00Z"
  }
}
```

**Special Behavior:**
- If this is the **first user ever** created in the system, they are automatically assigned the `super_admin` role regardless of what `role` was requested.
- Subsequent users get the role specified in the request body.

**Error Responses**
- `400` — Invalid request body or validation failure
- `401` — Unauthorized
- `403` — Forbidden (user is not `super_admin`)
- `409` — Email already exists

---

### PUT /api/v1/users/:id

Updates a user's `name` and/or `lastname`.

**Authorization:** Only the user themselves can update their own profile. Not even `super_admin` can update other users.

**Request**
```
PUT /api/v1/users/:id
X-User-Id: <uuid>
Content-Type: application/json

{
  "name": "John",
  "lastname": "UpdatedLastName"
}
```

**Fields (request body):**
| Field | Type | Required | Validation |
|-------|------|----------|-------------|
| `name` | string | No | Max 100 characters |
| `lastname` | string | No | Max 100 characters |

> **Note:** `email` and `role` cannot be changed through this endpoint.

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "user updated",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "name": "John",
    "lastname": "UpdatedLastName",
    "role": "user",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**
- `400` — Invalid user ID or request body
- `401` — Unauthorized
- `403` — Forbidden (user is not updating their own profile)
- `404` — User not found

---

### DELETE /api/v1/users/:id

Soft-deletes a user by setting `deleted_at = NOW()`. The user row is NOT physically removed. This operation is idempotent — re-deleting an already-deleted user succeeds silently.

**Authorization:**
- `super_admin` — can delete any user
- Same user ID as the requesting user — can delete their own account
- Otherwise → 403 Forbidden

**Request**
```
DELETE /api/v1/users/:id
X-User-Id: <uuid>
X-User-Role: super_admin   # optional depending on target user
```

**Response `200 OK`**
```json
{
  "status_code": 200,
  "message": "user deleted"
}
```

**Error Responses**
- `400` — Invalid user ID
- `401` — Unauthorized
- `403` — Forbidden (not the user themselves and not a super_admin)
- `404` — User not found

---

## Notes

- All timestamps are in ISO 8601 format (UTC).
- Soft-deleted users are filtered out of all queries — they are effectively invisible to the API.
- The `super_admin` role is unique (enforced by a DB index) and cannot be deleted or transferred through the API.
- Device access relationships (`user_device_access`) are managed separately and are not affected by user deletion (RESTRICT foreign key).
