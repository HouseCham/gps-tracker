import type { DeviceData } from "@/types/components";
import type { DataTableColumn } from "@/types/components/ui";
/**
 * @constant DEVICE_TABLE_COLUMNS
 * @description Columns for the device table
 * @type {DataTableColumn[]}
 */
export const DEVICE_TABLE_COLUMNS: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'lastSeen', label: 'Last Seen' },
    { key: 'battery', label: 'Battery', align: 'center' },
    { key: 'signal', label: 'Signal', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'right' },
];
/**
 * @constant DEMO_DEVICE
 * @description Demo device for the device table
 * @type {DeviceData}
 */
export const DEMO_DEVICE: DeviceData = {
    id: 'D-001',
    name: 'Delivery Van #3',
    uuid_firmware: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
};