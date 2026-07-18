import type { DeviceCardItem, DeviceData, DeviceTableItem } from '@/types/components';
/**
 * @constant DEVICE_GALLERY_DEMO_DEVICES
 * @description Demo devices for the device gallery
 * @type {DeviceTableItem[]}
 */
export const DEVICE_GALLERY_DEMO_DEVICES: Array<DeviceTableItem> = [
    {
        id: 'D-001',
        name: 'Delivery Van #3',
        status: 'online',
        lastSeen: '2 min ago',
        battery: 78,
        signal: 5,
    },
    {
        id: 'D-002',
        name: 'Cargo Truck #12',
        status: 'online',
        lastSeen: '1 min ago',
        battery: 92,
        signal: 4,
    },
    {
        id: 'D-003',
        name: 'Fleet Unit #7',
        status: 'online',
        lastSeen: '8 min ago',
        battery: 45,
        signal: 3,
    },
    {
        id: 'D-004',
        name: 'Service Van #2',
        status: 'offline',
        lastSeen: '4 hrs ago',
        battery: 15,
        signal: 0,
    },
    {
        id: 'D-005',
        name: 'ESP32-A4:CF:12',
        status: 'never-seen',
        lastSeen: null,
        battery: 0,
        signal: 1,
    },
];
/**
 * @constant DEVICE_GALLERY_DEMO_CARD_DEVICES
 * @description Demo devices for the device gallery card
 * @type {DeviceCardItem[]}
 */
export const DEVICE_GALLERY_DEMO_CARD_DEVICES: Array<DeviceCardItem> = [
    {
        id: 'D-001',
        name: 'Delivery Van #3',
        status: 'online',
        lastSeen: '2 min ago',
        battery: 78,
        signal: 5,
        uuid_firmware: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    },
    {
        id: 'D-004',
        name: 'Service Van #2',
        status: 'offline',
        lastSeen: '4 hrs ago',
        battery: 15,
        signal: 0,
        uuid_firmware: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    },
    {
        id: 'D-005',
        name: 'ESP32-A4:CF:12',
        status: 'never-seen',
        lastSeen: null,
        battery: 0,
        signal: 1,
        uuid_firmware: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    },
];

/**
 * @constant DEMO_DEVICE
 * @description Demo device for the device table
 */
export const DEMO_DEVICE: DeviceData = {
    id: 'D-001',
    name: 'Delivery Van #3',
    uuid_firmware: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    vehicle_type: 'van',
};