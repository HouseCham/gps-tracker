import type { DeviceVehicleType } from "@/types/api";

/**
 * @constant VEHICLE_TYPE_OPTIONS
 * @description The ordered list of selectable vehicle types.
 */
export const VEHICLE_TYPE_OPTIONS = [
    'bicycle',
    'motorcycle',
    'car',
    'truck',
    'van',
    'other',
] as const satisfies readonly DeviceVehicleType[];