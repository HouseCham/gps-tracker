/**
 * @interface DeviceMapPin
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {MarkerStatus} status - The status of the device.
 * @param {number} lat - The latitude of the device.
 * @param {number} lng - The longitude of the device.
 * @param {string | null} lastSeen - The last seen time of the device.
 * @param {string} [color] - Optional primary color override (CSS color).
 */
export interface DeviceMapPin {
    id: string;
    name: string;
    status: MarkerStatus;
    lat: number;
    lng: number;
    lastSeen: string | null;
    color?: string;
}
/**
 * @interface DeviceMapRoutePoint
 * @param {number} lat - The latitude of the route point.
 * @param {number} lng - The longitude of the route point.
 */
export interface DeviceMapRoutePoint {
    lat: number;
    lng: number;
}
/**
 * @type MarkerStatus
 * @description The status of the device.
 */
export type MarkerStatus = 'online' | 'offline' | 'never-seen' | 'unknown';
/**
 * @type RouteSpeed
 * @description The speed of the route.
 */
export type RouteSpeed = 1 | 2 | 4;