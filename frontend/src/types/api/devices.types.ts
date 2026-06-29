export interface Envelope<T> {
    status_code: number;
    message: string;
    data: T;
}

export type DeviceVehicleType =
    | 'bicycle'
    | 'motorcycle'
    | 'car'
    | 'truck'
    | 'van'
    | 'other';

export interface Device {
    id: string;
    uuid_firmware: string;
    name: string;
    vehicle_type: DeviceVehicleType;
    created_at: string;
    last_seen_at: string | null;
}

export interface DeviceWithAccess extends Device {
    access_role: 'owner' | 'editor' | 'viewer';
}

export interface DeviceDetail extends DeviceWithAccess {
    users: DeviceAccessListItem[];
}

export interface PaginationMeta {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
}

export interface DeviceListResponse {
    items: DeviceWithAccess[];
    pagination: PaginationMeta;
}

export interface CreateDeviceDto {
    uuid_firmware: string;
    name: string;
    vehicle_type: DeviceVehicleType;
}

export interface UpdateDeviceDto {
    name: string;
    vehicle_type?: DeviceVehicleType;
}

export interface DeviceAccess {
    user_id: string;
    device_id: string;
    role: 'viewer';
    created_at: string;
}

export interface DeviceAccessListItem {
    user_id: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    access_granted_at: string;
}
