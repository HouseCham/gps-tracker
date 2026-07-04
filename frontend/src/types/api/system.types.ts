import type { Envelope } from './devices.types';

/**
 * Flattened bootstrap status used by the frontend. `needsSetup` is
 * `true` when the local users table is empty — i.e. the first
 * visitor should be sent to the sign-up page to create the
 * super_admin. After any user exists, sign-up is closed.
 * @interface BootstrapStatus
 * @property {boolean} needsSetup - True when the app needs its first user.
 */
export interface BootstrapStatus {
    needsSetup: boolean;
}

/**
 * Type alias for the raw envelope shape returned by the backend.
 * Kept as an alias (not a re-declaration) so callers can use the
 * shared `Envelope<T>` definition from `devices.types.ts`.
 * @typedef BootstrapResponseEnvelope
 */
export type BootstrapResponseEnvelope = Envelope<boolean>;
