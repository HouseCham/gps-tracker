/**
 * Represents an active device API key — metadata only. The token itself
 * (plain_key) is never carried in this shape: the backend only returns it
 * at creation time and never persists it after that.
 * @typedef {Object} ApiKey
 * @property {string} id - UUID of the key row.
 * @property {string} created_at - ISO 8601 timestamp when the key was issued.
 * @property {string | null} last_used_at - ISO 8601 timestamp of last IoT auth,
 *   `null` if never used.
 * @property {string | null} expires_at - ISO 8601 expiration timestamp,
 *   `null` if no expiry is set.
 */
export interface ApiKey {
    id: string;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
}

/**
 * Response shape returned by POST /api/v1/devices/:id/api-keys.
 *
 * `plain_key` is the opaque token to flash onto the device firmware. The
 * backend returns it **exactly once** — subsequent GET/DELETE never surface
 * it. Callers must surface it to the user immediately and never persist it.
 * @typedef {Object} CreateApiKeyResponse
 * @property {string} id - UUID of the new key row.
 * @property {string} created_at - ISO 8601 timestamp when the key was issued.
 * @property {string} plain_key - Opaque lookup token. Shown once, then gone.
 */
export interface CreateApiKeyResponse {
    id: string;
    created_at: string;
    plain_key: string;
}

/**
 * Response shape returned by GET /api/v1/devices/:id/api-keys. The backend wraps the
 * array in the standard envelope, so this is the inner `data` payload.
 * @typedef {ApiKey[]} ApiKeyListResponse
 */
export type ApiKeyListResponse = ApiKey[];

/**
 * Single row returned by the global `GET /api/v1/api-keys` endpoint.
 * Joins `device_api_keys` with `devices` so the admin table can render
 * the Device column and drive the per-row revoke flow without a
 * second round-trip per row.
 *
 * `name` and `device_name` both carry the device display name -- the
 * two-field shape is intentional: `name` is what the row projects at
 * a glance, `device_name` makes the join explicit. `device_id` is
 * required by the per-row revoke flow
 * (`DELETE /api/v1/devices/:id/api-keys/:keyId`).
 *
 * @typedef {Object} ApiKeyWithDevice
 * @property {string} id - UUID of the key row.
 * @property {string} name - Display name of the owning device.
 * @property {string} device_name - Display name of the owning device
 *   (explicit form of `name`; both fields carry the same value).
 * @property {string} device_id - UUID of the owning device.
 * @property {string} created_at - ISO 8601 timestamp when the key was issued.
 */
export interface ApiKeyWithDevice {
    id: string;
    name: string;
    device_name: string;
    device_id: string;
    created_at: string;
}