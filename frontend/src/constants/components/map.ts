import type {
    DeviceLocationPoint,
    DeviceMapPin,
    DeviceMapRoutePoint,
    MarkerStatus,
    RouteSpeed,
} from '@/types/components';
/**
 * @constant MAP_STATUS_CLASS
 * @description Class names for the map status markers
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
 */
export const MAP_DEMO_PINS: DeviceMapPin[] = [
    {
        id: 'D-001',
        name: 'Delivery Van #3',
        status: 'online',
        lat: 19.4326,
        lng: -99.1332,
        lastSeen: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    {
        id: 'D-002',
        name: 'Fleet Unit #7',
        status: 'online',
        lat: 29.62,
        lng: -99.15,
        lastSeen: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
        id: 'D-003',
        name: 'Cargo Truck #12',
        status: 'online',
        lat: 39.445,
        lng: -99.115,
        lastSeen: new Date(Date.now() - 1 * 60000).toISOString(),
    },
    {
        id: 'D-004',
        name: 'Service Van #2',
        status: 'offline',
        lat: 49.405,
        lng: -99.16,
        lastSeen: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
        id: 'D-005',
        name: 'ESP32-A4:CF:12',
        status: 'never-seen',
        lat: 59.438,
        lng: -99.1,
        lastSeen: null,
    },
];
/**
 * @constant MAP_DEMO_ROUTE
 * @description Demo route for the map
 */
export const MAP_DEMO_ROUTE: DeviceMapRoutePoint[] = [
    { lat: 19.405, lng: -99.16 },
    { lat: 19.41, lng: -99.15 },
    { lat: 19.42, lng: -99.145 },
    { lat: 19.425, lng: -99.138 },
    { lat: 19.4326, lng: -99.1332 },
];
/**
 * @constant MAP_SPEED_OPTIONS
 * @description Speed options for the map
 */
export const MAP_SPEED_OPTIONS: RouteSpeed[] = [1, 2, 4];
/**
 * @constant MAP_LIVE_DEMO_LOCATION
 * @description Latest device location for the device-detail live map demo.
 * Stub data — replaced by /devices/:id/locations/latest once the backend
 * exposes the endpoint.
 */
export const MAP_LIVE_DEMO_LOCATION: DeviceLocationPoint = {
    lat: 19.4326,
    lng: -99.1332,
    recordedAt: new Date(Date.now() - 90 * 1000).toISOString(),
    speed: 42,
};
/**
 * @constant MAP_LIVE_DEMO_ROUTE
 * @description Recent route history for the device-detail live map demo.
 * Stub data — replaced by /devices/:id/locations once the backend
 * exposes the endpoint.
 */
export const MAP_LIVE_DEMO_ROUTE: DeviceLocationPoint[] = [
    { lat: 19.405, lng: -99.17, recordedAt: '2026-06-29T10:02:00Z' },
    { lat: 19.408, lng: -99.164, recordedAt: '2026-06-29T10:08:00Z' },
    { lat: 19.412, lng: -99.158, recordedAt: '2026-06-29T10:15:00Z' },
    { lat: 19.415, lng: -99.152, recordedAt: '2026-06-29T10:22:00Z' },
    { lat: 19.418, lng: -99.146, recordedAt: '2026-06-29T10:35:00Z' },
    { lat: 19.421, lng: -99.142, recordedAt: '2026-06-29T10:48:00Z' },
    { lat: 19.423, lng: -99.139, recordedAt: '2026-06-29T11:02:00Z' },
    { lat: 19.425, lng: -99.137, recordedAt: '2026-06-29T11:18:00Z' },
    { lat: 19.427, lng: -99.135, recordedAt: '2026-06-29T11:35:00Z' },
    { lat: 19.428, lng: -99.134, recordedAt: '2026-06-29T12:01:00Z' },
    { lat: 19.429, lng: -99.1335, recordedAt: '2026-06-29T12:30:00Z' },
    { lat: 19.43, lng: -99.1333, recordedAt: '2026-06-29T13:05:00Z' },
    { lat: 19.4308, lng: -99.133, recordedAt: '2026-06-29T13:42:00Z' },
    { lat: 19.4314, lng: -99.1328, recordedAt: '2026-06-29T14:08:00Z' },
    { lat: 19.4319, lng: -99.1326, recordedAt: '2026-06-29T14:21:00Z' },
    {
        lat: 19.4326,
        lng: -99.1332,
        recordedAt: new Date(Date.now() - 90 * 1000).toISOString(),
    },
];
