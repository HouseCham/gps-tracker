export interface Envelope<T> {
  status_code: number
  message: string
  data: T
}

export interface Device {
  id: string
  uuid_firmware: string
  name: string
  created_at: string
  last_seen_at: string | null
  access_role?: 'owner' | 'editor' | 'viewer'
}

export interface CreateDeviceDto {
  uuid_firmware: string
  name: string
}

export interface UpdateDeviceDto {
  name: string
}

export interface DeviceAccess {
  user_id: string
  device_id: string
  role: 'viewer'
  created_at: string
}

export interface DeviceAccessListItem {
  user_id: string
  email: string
  role: 'owner' | 'editor' | 'viewer'
  access_granted_at: string
}