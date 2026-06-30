-- name: GrantDeviceAccess :one
-- Grants a user access to a device with the given role.
-- Idempotent: if access already exists (even soft-deleted), it is reactivated
-- with the new role. Used for both first-time grant and role change.
INSERT INTO user_device_access (user_id, device_id, role, created_at, deleted_at)
VALUES ($1, $2, $3, NOW(), NULL)
ON CONFLICT (user_id, device_id) DO UPDATE
  SET role = EXCLUDED.role,
      deleted_at = NULL
RETURNING user_id, device_id, role, created_at, deleted_at;

-- name: RevokeDeviceAccess :exec
-- Soft-deletes the access grant. The pivot row stays in the table for
-- audit; queries filter on deleted_at IS NULL.
UPDATE user_device_access
SET deleted_at = NOW()
WHERE user_id = $1
  AND device_id = $2
  AND deleted_at IS NULL;

-- name: GetDeviceAccess :one
-- Returns the access row for a (user, device) pair, or sql.ErrNoRows.
-- Used by the API to authorize per-device actions (owner/editor/viewer).
SELECT user_id, device_id, role, created_at, deleted_at
FROM user_device_access
WHERE user_id = $1
  AND device_id = $2
  AND deleted_at IS NULL;

-- name: ListUsersForDevice :many
-- Inverse of ListDevicesForUser: returns all users that have access
-- to a given device, with their role. Used in the device admin panel.
SELECT
  u.id,
  u.name,
  u.email,
  uda.role AS access_role,
  uda.created_at AS access_granted_at
FROM users u
INNER JOIN user_device_access uda
  ON u.id = uda.user_id AND uda.deleted_at IS NULL
WHERE uda.device_id = $1
  AND u.deleted_at IS NULL
ORDER BY uda.created_at DESC;
