export type DevicePlatform = 'android' | 'windows'

export type DeviceEnrollmentStatus = 'active' | 'revoked' | 'pending'

export interface Device {
  id: string
  device_name: string
  platform: DevicePlatform
  enrollment_status: DeviceEnrollmentStatus
  last_seen_at: string | null
  created_at?: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page?: number
  last_page?: number
  total?: number
  per_page?: number
}
