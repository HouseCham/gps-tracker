import type { DeviceVehicleType } from '@/types/api';
import type { MarkerStatus } from './map.types';
/**
 * @interface DeviceTableItem
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {MarkerStatus} status - The status of the device.
 * @param {string | null} lastSeen - The last seen time of the device.
 * @param {number} battery - The battery level of the device.
 * @param {number} signal - The signal strength of the device.
 */
export interface DeviceTableItem {
    id: string;
    name: string;
    status: MarkerStatus;
    lastSeen: string | null;
    battery: number;
    signal: number;
}
/**
 * @interface DeviceCardItem
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {MarkerStatus} status - The status of the device.
 * @param {string | null} lastSeen - The last seen time of the device.
 * @param {number} battery - The battery level of the device.
 * @param {number} signal - The signal strength of the device.
 * @param {string} uuid_firmware - The UUID of the firmware.
 */
export interface DeviceCardItem {
    id: string;
    name: string;
    status: MarkerStatus;
    lastSeen: string | null;
    battery: number;
    signal: number;
    uuid_firmware: string;
}
/**
 * @interface DeviceFormValues
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {string} uuid_firmware - The UUID of the firmware.
 * @param {DeviceVehicleType} vehicle_type - The vehicle category.
 */
export interface DeviceFormValues {
    name: string;
    uuid_firmware: string;
    vehicle_type: DeviceVehicleType;
}
/**
 * @interface DeviceData
 * @param {string} id - The ID of the device.
 * @param {string} name - The name of the device.
 * @param {string} uuid_firmware - The UUID of the firmware.
 * @param {DeviceVehicleType} vehicle_type - The vehicle category.
 */
export interface DeviceData {
    id: string;
    name: string;
    uuid_firmware: string;
    vehicle_type: DeviceVehicleType;
}
/**
 * @interface DeviceFormStrings
 * @param {string} title - The title of the form.
 * @param {string} nameLabel - The label for the name field.
 * @param {string} namePlaceholder - The placeholder for the name field.
 * @param {string} uuidLabel - The label for the UUID field.
 * @param {string} uuidPlaceholder - The placeholder for the UUID field.
 * @param {string} vehicleTypeLabel - The label for the vehicle type field.
 * @param {string} vehicleTypeRequired - The error message for the vehicle type field.
 * @param {string} nameRequired - The error message for the name field.
 * @param {string} uuidRequired - The error message for the UUID field.
 * @param {string} uuidInvalid - The error message for the UUID field.
 * @param {string} save - The label for the save button.
 * @param {string} saving - The label for the saving button.
 * @param {string} cancel - The label for the cancel button.
 * @param {string} deleteConfirm - The confirmation message for the delete button.
 * @param {string} deleteDevice - The label for the delete button.
 */
export interface DeviceFormStrings {
    title?: string;
    nameLabel?: string;
    namePlaceholder?: string;
    uuidLabel?: string;
    uuidPlaceholder?: string;
    vehicleTypeLabel?: string;
    vehicleTypeRequired?: string;
    nameRequired?: string;
    uuidRequired?: string;
    uuidInvalid?: string;
    save?: string;
    saving?: string;
    cancel?: string;
    deleteConfirm?: string;
    deleteDevice?: string;
}
