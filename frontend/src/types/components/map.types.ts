import type { ReactNode } from "react";

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
/**
 * @interface Coordinate
 * @param {number} x - The x coordinate.
 * @param {number} y - The y coordinate.
 */
export interface Coordinate {
    x: number;
    y: number
};
/**
 * @interface MapPopoverDevice
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {MarkerStatus} status - The status of the device.
 * @param {number} lat - The latitude of the device.
 * @param {number} lng - The longitude of the device.
 * @param {string | null} lastSeen - The last seen time of the device.
 * @param {string} [speed] - The speed of the device.
 * @param {number} [battery] - The battery level of the device.
 * @param {string} [heading] - The heading of the device.
 * @param {{ label: string; value: ReactNode; tone?: 'default' | 'warning' | 'danger' }[]} [extra] - Extra information about the device.
 */
export interface MapPopoverDevice {
    id: string;
    name: string;
    status: MarkerStatus;
    lat: number;
    lng: number;
    lastSeen: string | null;
    speed?: number | string;
    battery?: number;
    heading?: string;
    extra?: { label: string; value: ReactNode; tone?: 'default' | 'warning' | 'danger' }[];
}