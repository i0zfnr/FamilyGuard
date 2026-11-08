export type NetworkType = 'wifi' | 'cellular' | 'ethernet' | 'none' | 'other'

export interface Telemetry {
  id?: number
  device_id?: string
  battery_percentage: number | null
  charging: boolean | null
  storage_total: number | null
  storage_available: number | null
  network_type: NetworkType | null
  recorded_at: string
}
