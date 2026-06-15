-- name: GetUserByID :one
-- Used by the Authula middleware to load the current user from the DB
-- after JWT validation. Filters out soft-deleted users.
SELECT id, email, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
-- Lookup by email. Used by the lazy user creation flow as a fallback
-- when the JWT id is not available.
SELECT id, email, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
-- Creates a new user with name, lastname, role, and must_change_password.
-- Returns the created user.
INSERT INTO users (email, name, lastname, role)
VALUES ($1, $2, $3, $4)
RETURNING id, email, name, lastname, role, must_change_password, created_at, updated_at, deleted_at;

-- name: GetUserList :many
-- Returns all active users except the given user ID.
-- Used by admin-level endpoints to list registered users.
SELECT id, email, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL AND id != $1;

-- name: CountUsers :one
-- Used by the lazy creation middleware to determine if the incoming
-- user is the first one (becomes super_admin) or a regular one.
-- Counts only active (non-soft-deleted) users.
SELECT COUNT(*)::bigint AS count
FROM users
WHERE deleted_at IS NULL;

-- name: UpdateUser :one
-- Updates a user's name and lastname. Only the user themselves can update
-- their own profile. Returns the updated user.
UPDATE users
SET name = $2, lastname = $3, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, email, name, lastname, role, must_change_password, created_at, updated_at, deleted_at;

-- name: SetUserMustChangePassword :exec
-- Sets the must_change_password flag for the given user.
UPDATE users
SET must_change_password = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;

-- name: SoftDeleteUser :exec
-- Marks a user as deleted by setting deleted_at = NOW().
-- The row is NOT physically removed. Idempotent: re-deleting
-- an already-deleted user is a no-op.
UPDATE users
SET deleted_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;
