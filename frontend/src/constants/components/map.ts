import type { DeviceMapPin, DeviceMapRoutePoint, MarkerStatus } from "@/types/components";
/**
 * @constant MAP_STATUS_LABEL
 * @description Label for each marker status
 * @type {Record<MarkerStatus, string>}
 */
export const MAP_STATUS_LABEL: Record<MarkerStatus, string> = {
    online: 'Online',
    offline: 'Offline',
    'never-seen': 'Never seen',
    unknown: 'Unknown',
};
/**
 * @constant MAP_STATUS_CLASS
 * @description Class for each marker status
 * @type {Record<MarkerStatus, string>}
 */
export const MAP_STATUS_CLASS: Record<MarkerStatus, string> = {
    online: 'map-popover__badge--online',
    offline: 'map-popover__badge--offline',
    'never-seen': 'map-popover__badge--warning',
    unknown: 'map-popover__badge--muted',
};
/**
 * @constant MAP_DEMO_PINS
 * @description Demo pins for the map
 * @type {DeviceMapPin[]}
 */
export const MAP_DEMO_PINS: DeviceMapPin[] = [
    { id: 'D-001', name: 'Delivery Van #3',   status: 'online',     lat:  19.4326, lng: -99.1332, lastSeen: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: 'D-002', name: 'Fleet Unit #7',     status: 'online',     lat:  19.4200, lng: -99.1500, lastSeen: new Date(Date.now() - 8 * 60000).toISOString() },
    { id: 'D-003', name: 'Cargo Truck #12',   status: 'online',     lat:  19.4450, lng: -99.1150, lastSeen: new Date(Date.now() - 1 * 60000).toISOString() },
    { id: 'D-004', name: 'Service Van #2',    status: 'offline',    lat:  19.4050, lng: -99.1600, lastSeen: new Date(Date.now() - 4 * 3600000).toISOString() },
    { id: 'D-005', name: 'ESP32-A4:CF:12',    status: 'never-seen', lat:  19.4380, lng: -99.1000, lastSeen: null },
];
/**
 * @constant MAP_DEMO_ROUTE
 * @description Demo route for the map
 * @type {DeviceMapRoutePoint[]}
 */
export const MAP_DEMO_ROUTE: DeviceMapRoutePoint[] = [
    { lat: 19.4050, lng: -99.1600 },
    { lat: 19.4100, lng: -99.1500 },
    { lat: 19.4200, lng: -99.1450 },
    { lat: 19.4250, lng: -99.1380 },
    { lat: 19.4326, lng: -99.1332 },
];