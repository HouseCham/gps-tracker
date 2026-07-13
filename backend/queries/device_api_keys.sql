-- name: GetActiveKeyByHash :one
-- Hot auth path for the IoT device authentication.
-- The device sends X-Device-Key: <plain>; the backend bcrypt-hashes it and
-- looks up by hash. Filters out soft-deleted and expired keys.
-- The Go layer is responsible for verifying that the key's device_id
-- matches the device_id from the URL/path.
SELECT id, device_id, key_hash, created_at, expires_at, last_used_at, deleted_at
FROM device_api_keys
WHERE key_hash = $1
  AND deleted_at IS NULL
  AND (expires_at IS NULL OR expires_at > NOW());

-- name: GetActiveKeyByDeviceID :one
-- Pre-check used by the application service before issuing a new key.
-- The new partial UNIQUE index on (device_id) WHERE deleted_at IS NULL
-- is the source of truth; this query exists only to surface a friendly
-- 409 error path on the common case (without it the user gets a raw
-- SQLSTATE 23505). Soft-deleted rows are ignored — revoked keys do not
-- count against the single-active-key invariant.
SELECT id, device_id, key_hash, created_at, expires_at, last_used_at, deleted_at
FROM device_api_keys
WHERE device_id = $1 AND deleted_at IS NULL;

-- name: CreateAPIKey :one
-- Inserts a new API key. The caller must bcrypt-hash the key before storing;
-- the plain key is returned to the admin only at creation time and never again.
-- expires_at is nullable: NULL = no expiration.
INSERT INTO device_api_keys (device_id, key_hash, expires_at)
VALUES ($1, $2, $3)
RETURNING id, device_id, key_hash, created_at, expires_at, last_used_at, deleted_at;

-- name: MarkAPIKeyUsed :exec
-- Updates last_used_at on every successful auth. Cheap, no RETURNING.
-- Lets the admin UI show "last seen" per key.
UPDATE device_api_keys
SET last_used_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;

-- name: RevokeAPIKey :exec
-- Soft-deletes the key. Used for rotation: create a new key, then revoke
-- the old one. Soft delete + UNIQUE partial index on the hash means
-- a new key with the same hash can be created immediately (the old row
-- no longer occupies the unique constraint).
UPDATE device_api_keys
SET deleted_at = NOW()
WHERE id = $1 AND deleted_at IS NULL;

-- name: ListAPIKeysForDevice :many
-- Returns all active keys for a device, for the admin UI.
-- Does NOT return the plain key (it was never stored).
SELECT id, device_id, key_hash, created_at, expires_at, last_used_at, deleted_at
FROM device_api_keys
WHERE device_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;
