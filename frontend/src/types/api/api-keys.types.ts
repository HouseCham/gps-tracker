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
 * Body returned by GET /api/v1/devices/:id/api-keys. The backend wraps the
 * array in the standard envelope, so this is the inner `data` payload.
 * @typedef {ApiKey[]} ApiKeyListResponse
 */
export type ApiKeyListResponse = ApiKey[];