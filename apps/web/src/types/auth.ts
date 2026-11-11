export interface User {
  id: string | number
  name: string
  email: string
  role?: string
  mfa_enabled?: boolean
  created_at?: string
}

export interface AuthResponse {
  user?: User
  confirmationRequired?: boolean
  message?: string
}

export interface CsrfResponse {
  csrf_token: string
}

export interface ApiErrorPayload {
  message?: string
  errors?: Record<string, string[]>
}
