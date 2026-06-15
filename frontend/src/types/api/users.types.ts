

export interface User {
  id: string
  email: string
  name: string
  lastname: string
  role: 'user' | 'super_admin'
  created_at: string
}

export interface UserWithDevices extends User {
  devices: Array<{
    id: string
    uuid_firmware: string
    name: string
  }>
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export interface CreateUserDto {
  email: string
  name?: string
  lastname?: string
  role: 'user' | 'super_admin'
}

export interface UpdateUserDto {
  name?: string
  lastname?: string
}