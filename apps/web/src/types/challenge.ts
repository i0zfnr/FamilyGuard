export interface EnrollmentChallenge {
  id: string
  token: string
  expires_at: string
  enrollment_available: boolean
}

export interface AuditLog {
  id: number
  event_type: string
  description: string
  ip_address?: string
  created_at: string
}
