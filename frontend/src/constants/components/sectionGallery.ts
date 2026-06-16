import type { ActivityItem, AdminStatItem, DeviceDetailData, DeviceTableItem } from "@/types/components";
/**
 * @constant SECTION_GALLERY_DEMO_KPI_ITEMS
 * @description Demo KPI items for the section gallery
 * @type {AdminStatItem[]}
 */
export const SECTION_GALLERY_DEMO_KPI_ITEMS: Array<AdminStatItem> = [
    { label: 'Total Devices', value: 24, icon: 'cpu' as const, trend: 'up' as const, trendValue: '+3 today', variant: 'neutral' as const },
    { label: 'Online Now',     value: 18, icon: 'wifi' as const, trend: 'up' as const, trendValue: '+2',      variant: 'success' as const },
    { label: 'Offline',        value: 5,  icon: 'wifi-off' as const, trend: 'down' as const, trendValue: '-1', variant: 'warning' as const },
    { label: 'Alerts',         value: 1,  icon: 'alert' as const, trend: 'flat' as const, trendValue: '0',    variant: 'danger' as const },
];
/**
 * @constant SECTION_GALLERY_DEMO_ACTIVITIES
 * @description Demo activities for the section gallery
 * @type {ActivityItem[]}
 */
export const SECTION_GALLERY_DEMO_ACTIVITIES: Array<ActivityItem> = [
    { id: 'A-001', type: 'device-online',    message: 'Delivery Van #3 came online',          timestamp: '2 min ago' },
    { id: 'A-002', type: 'location-update',   message: 'Cargo Truck #12: new position recorded', timestamp: '8 min ago' },
    { id: 'A-003', type: 'device-offline',    message: 'Service Van #2 went offline',           timestamp: '12 min ago' },
    { id: 'A-004', type: 'alert',            message: 'ESP32-A4:CF:12 battery critical (3%)',  timestamp: '18 min ago' },
    { id: 'A-005', type: 'device-added',     message: 'Fleet Unit #7 was registered',          timestamp: '1 hr ago', user: 'Alex Chen' },
    { id: 'A-006', type: 'user-login',       message: 'Maya Okafor logged in',                timestamp: '2 hrs ago', user: 'Maya Okafor' },
    { id: 'A-007', type: 'role-change',      message: 'Diego Ruiz promoted to Fleet Manager', timestamp: '4 hrs ago', user: 'Admin' },
];
/**
 * @constant SECTION_GALLERY_DEMO_DEVICES
 * @description Demo devices for the section gallery
 * @type {DeviceTableItem[]}
 */
export const SECTION_GALLERY_DEMO_DEVICES: Array<DeviceTableItem> = [
    { id: 'D-001', name: 'Delivery Van #3',   status: 'online' as const,     lastSeen: '2 min ago',  battery: 78, signal: 5 },
    { id: 'D-002', name: 'Cargo Truck #12',   status: 'online' as const,     lastSeen: '8 min ago',  battery: 45, signal: 3 },
    { id: 'D-003', name: 'Fleet Unit #7',     status: 'online' as const,     lastSeen: '1 min ago',  battery: 92, signal: 4 },
    { id: 'D-004', name: 'Service Van #2',    status: 'offline' as const,    lastSeen: '4 hrs ago',  battery: 15, signal: 0 },
];
/**
 * @constant SECTION_GALLERY_DEMO_DEVICE
 * @description Demo device for the section gallery
 * @type {DeviceDetailData}
 */
export const SECTION_GALLERY_DEMO_DEVICE: DeviceDetailData = {
    id: 'D-001',
    name: 'Delivery Van #3',
    status: 'online' as const,
    lastSeen: '2 min ago',
    battery: 78,
    signal: 5,
    uuid_firmware: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    lat: 19.4326,
    lng: -99.1332,
    createdAt: '2026-01-15',
};