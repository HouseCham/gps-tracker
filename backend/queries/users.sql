-- name: GetUserByID :one
-- Used by the Authula middleware to load the current user from the DB
-- after JWT validation. Filters out soft-deleted users.
SELECT id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: GetUserByEmail :one
-- Lookup by email. Used by the lazy user creation flow as a fallback
-- when the JWT id is not available.
SELECT id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
-- Creates a new user. Callers must pass must_change_password and
-- email_verified explicitly:
--   * must_change_password: true for admin-created users (temporary
--     password, must change on first login), false for self-service
--     signups (user picks their own password).
--   * email_verified: true ONLY for the very first registered user
--     (becomes super_admin). Every subsequent user — including those
--     created via the admin endpoint — must pass false.
-- image is not set by the app (nullable column).
-- Returns the created user.
INSERT INTO users (email, name, lastname, role, must_change_password, email_verified)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at;

-- name: GetUserList :many
-- Returns all active users except the given user ID.
-- Used by admin-level endpoints to list registered users.
SELECT id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at
FROM users
WHERE deleted_at IS NULL AND id != $1;

-- name: CountUsers :one
-- Used by the lazy creation middleware to determine if the incoming
-- user is the first one (becomes super_admin) or a regular one.
-- Counts only active (non-soft-deleted) users.
SELECT COUNT(*)::bigint AS count
FROM users
WHERE deleted_at IS NULL;

-- name: HasSuperAdmin :one
-- Returns true if any active user in the system has the super_admin
-- role. Used by GetOrCreate to decide whether the user being looked
-- up (or created) is the very first user and must be promoted to
-- super_admin. Faster and more semantically precise than counting
-- total users: the partial unique index on role='super_admin' makes
-- this a constant-time lookup in practice.
SELECT EXISTS (
  SELECT 1
  FROM users
  WHERE role = 'super_admin' AND deleted_at IS NULL
) AS "hasSuperAdmin";

-- name: UpdateUser :one
-- Updates a user's name and lastname. Only the user themselves can update
-- their own profile. Returns the updated user.
UPDATE users
SET name = $2, lastname = $3, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at;

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

-- name: PromoteToSuperAdmin :one
-- Promotes an existing user to the super_admin role and clears the
-- must_change_password flag. Used by GetOrCreate when the looked-up
-- user is the only one in the system (HasSuperAdmin returned false)
-- — typically because Authula's email-password signup created the
-- row with role='user' (the SQL DEFAULT) before our hook fires.
-- The partial unique index idx_users_one_super_admin guarantees at
-- most one such row, so the WHERE clause does not need an extra
-- role guard.
UPDATE users
SET role                = 'super_admin',
    must_change_password = FALSE,
    updated_at           = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, email, email_verified, image, name, lastname, role, must_change_password, created_at, updated_at, deleted_at;
