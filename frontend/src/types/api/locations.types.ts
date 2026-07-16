/**
 * One location row as returned by the read-side locations endpoints.
 * Field names mirror the backend `LocationResponse` shape (snake_case)
 * so the wire payload maps 1:1 — no client-side renaming needed.
 *
 * Nullable telemetry fields stay as `| null` so a missing sensor
 * reading surfaces in the UI as "—" rather than a misleading zero.
 *
 * @interface LocationPoint
 * @property {string} device_id - UUID of the device that reported the row.
 * @property {string} recorded_at - ISO 8601 timestamp of the GPS fix.
 * @property {number} latitude - WGS84 latitude (decimal degrees).
 * @property {number} longitude - WGS84 longitude (decimal degrees).
 * @property {number | null} altitude - Altitude above sea level (meters).
 * @property {number | null} speed - Ground speed (m/s).
 * @property {number | null} accuracy - Position accuracy (meters).
 * @property {number | null} battery_voltage - Reported battery voltage (volts).
 * @property {number | null} signal_strength - Cellular RSSI (`0`–`31`).
 */
export interface LocationPoint {
    device_id: string;
    recorded_at: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed: number | null;
    accuracy: number | null;
    battery_voltage: number | null;
    signal_strength: number | null;
}

/**
 * Type alias for the connection state of a device.
 * @typedef ConnectionState
 */
export type ConnectionState = 'online' | 'disconnected' | 'neverSeen';
