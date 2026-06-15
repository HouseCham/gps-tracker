# Authentication

The API uses **Authula** — an embedded Go auth library — for authentication. Authula runs in-process and owns its own Postgres tables for users, sessions, JWT keys, and refresh tokens.

## Auth Flow (End-to-End)

```
┌──────────┐     ┌───────────────┐     ┌─────────────┐
│  Client  │ ──► │  Authula      │ ──► │  App's      │
│          │ ◄── │  (embedded)   │ ◄── │  Middleware  │
└──────────┘     └───────────────┘     └─────────────┘
```

### 1. Sign Up / Sign In (Public Endpoints)

```
POST /api/auth/email-password/sign-up
POST /api/auth/email-password/sign-in
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (both endpoints):**
```json
{
  "access_token": "eyJhbGciOiJFZERTQSIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "expires_in": 900
}
```

- `access_token` — EdDSA JWT, **15-minute TTL**
- `refresh_token` — Opaque token, **7-day TTL**, sliding-window rotation
- Sign-up immediately authenticates (auto-sign-in is enabled)

### 2. Token Refresh

```
POST /api/token/refresh
```

Exchanges a valid refresh token for a new access/refresh pair (slides the window).

### 3. Protected Requests

All `/api/v1/*` endpoints require the access token:

```
Authorization: Bearer <access_token>
```

The middleware pipeline (in order):

| Step | Middleware | What It Does | Failure |
|------|-----------|-------------|---------|
| 1 | `AuthJWT` | Extracts Bearer token, validates JWT signature + expiry, stores `*models.Actor` in `c.Locals("claims")` | 401 |
| 2 | `LazyUser` | Fetches email from Authula's users table, then **get-or-create** a row in the app's local `users` table. Stores `*domain.User` in `c.Locals("user")` | 401 |
| 3a | `RequireUserRole` (optional) | Checks the user's global role (`user` or `super_admin`) | 403 |
| 3b | `RequireDeviceRole` (optional) | Checks the user's role on a specific device (`viewer`, `editor`, `owner`) | 403/404 |

Lazy population: the first time an authenticated user hits any endpoint, a row is created in the app's `users` table (linked by email). The very first user ever created gets the `super_admin` role.

### 4. Sign Out

```
POST /api/auth/sign-out
```

Invalidates the session in Authula's `sessions` table.

## Endpoints

All served at the `/api/auth` prefix via Authula's built-in `net/http.Handler` (adapted to Fiber).

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/email-password/sign-up` | Register a new account |
| POST | `/api/auth/email-password/sign-in` | Sign in with email + password |
| POST | `/api/auth/token/refresh` | Refresh access token |
| POST | `/api/auth/sign-out` | Invalidate current session |
| POST | `/api/auth/email-password/request-password-reset` | Request password reset |
| POST | `/api/auth/email-password/change-password` | Change password (requires current password) |
| GET | `/api/auth/.well-known/jwks.json` | Public EdDSA keys for JWT verification |

## Token Lifecycle

| Aspect | Detail |
|--------|--------|
| Access token type | EdDSA JWT |
| Access TTL | 15 minutes |
| Refresh token type | Opaque (opaque string) |
| Refresh TTL | 7 days, sliding-window rotation on each refresh |
| Signing key rotation | Every 30 days, 1-hour grace period |
| Blacklist | Disabled — bounded by 15-min access TTL |

## Error Responses

| Status Code | Meaning |
|-------------|---------|
| 401 | Missing, expired, or invalid access token |
| 403 | Authenticated but insufficient role/permissions |
| 404 | Device not found or no access (security through obscurity) |

## User Roles (Application-Level)

The app's `users` table maintains its own role separate from Authula:

| Role | Hierarchy | Description |
|------|-----------|-------------|
| `user` | 1 | Standard user — can access own resources |
| `super_admin` | 2 | Administrator — can manage all users and devices |

## Device Access Roles

Per-device roles managed via `user_device_access` grants:

| Role | Hierarchy | Permissions |
|------|-----------|-------------|
| `viewer` | 1 | Read-only |
| `editor` | 2 | Read + update |
| `owner` | 3 | Full control (including access management) |

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTHULA_SECRET` | Yes | — | 32-byte hex string for signing |
| `AUTHULA_BASE_URL` | No | `http://localhost:8080` | Base URL for JWKS links |
| `DATABASE_URL` | Yes | — | Postgres connection string |
| `APP_NAME` | No | `gps-tracker-api` | Display name for emails |
