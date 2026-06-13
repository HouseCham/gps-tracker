-- name: GetUserByID :one
-- Used by the Authula middleware to load the current user from the DB
-- after JWT validation. Filters out soft-deleted users.
SELECT id, email, role, created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
-- Lookup by email. Used by the lazy user creation flow as a fallback
-- when the JWT id is not available.
SELECT id, email, role, created_at, updated_at, deleted_at
FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
-- Idempotent user creation. Called by the lazy creation middleware.
-- If the user already exists (race condition between two simultaneous
-- requests with the same JWT), the insert is a no-op and the function
-- returns sql.ErrNoRows. The middleware then falls back to GetUserByID.
INSERT INTO users (id, email, role)
VALUES ($1, $2, $3)
ON CONFLICT (id) DO NOTHING
RETURNING id, email, role, created_at, updated_at, deleted_at;

-- name: CountUsers :one
-- Used by the lazy creation middleware to determine if the incoming
-- user is the first one (becomes super_admin) or a regular one.
-- Counts only active (non-soft-deleted) users.
SELECT COUNT(*)::bigint AS count
FROM users
WHERE deleted_at IS NULL;
