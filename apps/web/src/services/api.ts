import type {
  User,
  AuthResponse,
  ApiErrorPayload,
  Device,
  PaginatedResponse,
  Telemetry,
  EnrollmentChallenge,
} from '../types'
import { getSupabaseClient, getSupabaseFunctionUrl, getSupabasePublishableKey } from './supabase'

export class RequestError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.errors = errors
  }
}

function serviceSetupError(error: unknown): RequestError {
  return new RequestError(
    error instanceof Error ? error.message : 'XennGuard data service is not configured.',
    503,
  )
}

function safeSignupMessage(message: string): string {
  if (/already registered|already exists|duplicate/i.test(message)) {
    return 'Unable to create an account with these details. Try signing in or use another email address.'
  }
  return message
}

async function fetchResponse(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new RequestError('Cannot reach XennGuard’s data service. Check your connection and try again.', 0)
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let client
  let url: string
  let publishableKey: string
  try {
    client = getSupabaseClient()
    url = getSupabaseFunctionUrl()
    publishableKey = getSupabasePublishableKey()
  } catch (error) {
    throw serviceSetupError(error)
  }

  const { data: { session } } = await client.auth.getSession()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('apikey', publishableKey)
  headers.set('Authorization', `Bearer ${session?.access_token ?? publishableKey}`)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetchResponse(`${url}/api/v1${path}`, { ...options, headers })
  if (!response.ok) {
    const errorPayload: ApiErrorPayload = await response.json().catch(() => ({}))
    const validationMessage = errorPayload.errors
      ? Object.values(errorPayload.errors).flat().join(' ')
      : undefined
    throw new RequestError(
      response.status >= 500
        ? `XennGuard’s data service is unavailable (HTTP ${response.status}). Try again later.`
        : validationMessage || errorPayload.message || 'Request failed.',
      response.status,
      errorPayload.errors,
    )
  }
  if (response.status === 204) {
    return {} as T
  }
  return response.json() as Promise<T>
}

async function profileFor(user: { id: string; email?: string | null }): Promise<User> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, name, role, mfa_enabled, created_at')
    .eq('id', user.id)
    .single()
  if (error || !data) {
    throw new RequestError('Your profile is not ready. Try again later.', 503)
  }
  return {
    id: data.id,
    name: data.name,
    email: user.email ?? '',
    role: data.role,
    mfa_enabled: data.mfa_enabled,
    created_at: data.created_at,
  }
}

export const api = {
  auth: {
    me: async (): Promise<{ user: User }> => {
      let client
      try {
        client = getSupabaseClient()
      } catch (error) {
        throw serviceSetupError(error)
      }
      const { data, error } = await client.auth.getUser()
      if (error || !data.user) {
        throw new RequestError('Unauthenticated.', 401)
      }
      return { user: await profileFor(data.user) }
    },
    login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      let client
      try {
        client = getSupabaseClient()
      } catch (error) {
        throw serviceSetupError(error)
      }
      const { data, error } = await client.auth.signInWithPassword(credentials)
      if (error || !data.user) {
        throw new RequestError('Email or password is incorrect.', 422)
      }
      return { user: await profileFor(data.user) }
    },
    register: async (input: { name: string; email: string; password: string; password_confirmation: string }): Promise<AuthResponse> => {
      let client
      try {
        client = getSupabaseClient()
      } catch (error) {
        throw serviceSetupError(error)
      }
      const { data, error } = await client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { name: input.name.trim() },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        throw new RequestError(safeSignupMessage(error.message), 422)
      }
      if (!data.user) {
        throw new RequestError('Unable to create your account. Try again later.', 503)
      }
      if (!data.session) {
        return {
          confirmationRequired: true,
          message: 'Check your email for a confirmation link before signing in.',
        }
      }
      return { user: await profileFor(data.user) }
    },
    logout: async (): Promise<{ message: string }> => {
      let client
      try {
        client = getSupabaseClient()
      } catch (error) {
        throw serviceSetupError(error)
      }
      const { error } = await client.auth.signOut()
      if (error) {
        throw new RequestError('Could not sign out. Try again.', 503)
      }
      return { message: 'Signed out.' }
    },
  },
  devices: {
    list: () => request<PaginatedResponse<Device>>('/devices'),
    get: (id: string) => request<{ device: Device }>(`/devices/${id}`),
    revoke: (id: string) => request<{ message: string }>(`/devices/${id}/revoke`, { method: 'POST' }),
    telemetry: (id: string) => request<PaginatedResponse<Telemetry>>(`/devices/${id}/telemetry`),
  },
  challenges: {
    create: () => request<EnrollmentChallenge>('/devices/enrollment-challenges', { method: 'POST' }),
    revoke: (id: string) => request<{ message: string }>(`/devices/enrollment-challenges/${id}`, { method: 'DELETE' }),
  },
  health: {
    check: () => request<{ status: string }>('/health'),
  },
}
