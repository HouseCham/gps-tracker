//-- Types
import type { ConnectionState } from "@/types/api";
//-- Constants
import { MAP_ONLINE_THRESHOLD_MS } from '@/constants/components';

/**
 * Determine the connection state of a device based on the last recorded location.
 * @param {string | null | undefined} recordedAt - The last recorded location.
 * @param {number} now - The current timestamp. Defaults to `Date.now()`.
 * @returns {ConnectionState} The connection state of the device.
 */
export function getConnectionStateFrom(
    recordedAt: string | null | undefined,
    now: number = Date.now()
): ConnectionState {
    if (!recordedAt) return 'neverSeen';
    const age = now - new Date(recordedAt).getTime();
    if (Number.isNaN(age) || age < 0) return 'neverSeen';
    return age <= MAP_ONLINE_THRESHOLD_MS ? 'online' : 'disconnected';
}

/**
 * Maps a `ConnectionState` to a `BadgeVariant`.
 * @param {ConnectionState} state - The connection state of the device.
 * @returns {BadgeVariant} 'success' | 'danger' | 'default'.
 */
export function getConnectionVariant(state: ConnectionState): 'success' | 'danger' | 'default' {
    switch (state) {
        case 'online':
            return 'success';
        case 'disconnected':
            return 'danger';
        case 'neverSeen':
            return 'default';
    }
}