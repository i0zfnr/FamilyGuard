import type {
  User,
  AuthResponse,
  CsrfResponse,
  ApiErrorPayload,
  Device,
  PaginatedResponse,
  Telemetry,
  EnrollmentChallenge,
} from '../types'

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

let cachedCsrfToken: string | null = null

export async function fetchCsrfToken(): Promise<string> {
  const response = await fetch('/api/v1/csrf', {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new RequestError('Could not initialize session security token.', response.status)
  }
  const payload: CsrfResponse = await response.json()
  cachedCsrfToken = payload.csrf_token
  return payload.csrf_token
}

export function clearCsrfToken(): void {
  cachedCsrfToken = null
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (method !== 'GET') {
    if (!cachedCsrfToken) {
      try {
        await fetchCsrfToken()
      } catch {
        // If CSRF fetch fails, attempt proceeding so backend error displays clearly
      }
    }
    if (cachedCsrfToken) {
      headers['X-CSRF-TOKEN'] = cachedCsrfToken
    }
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
  }

  const response = await fetch('/api/v1' + path, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // If CSRF token mismatch (419), invalidate cache and retry once
    if (response.status === 419 && method !== 'GET') {
      cachedCsrfToken = null
      await fetchCsrfToken()
      headers['X-CSRF-TOKEN'] = cachedCsrfToken!
      const retryResponse = await fetch('/api/v1' + path, {
        ...options,
        headers,
      })
      if (retryResponse.ok) {
        return (await retryResponse.json()) as T
      }
    }

    const errorPayload: ApiErrorPayload = await response.json().catch(() => ({}))
    const validationMessage = errorPayload.errors
      ? Object.values(errorPayload.errors).flat().join(' ')
      : undefined
    const errorMessage = validationMessage || errorPayload.message || 'Request failed.'
    throw new RequestError(errorMessage, response.status, errorPayload.errors)
  }

  // Handle empty body responses (e.g. 204 No Content)
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export const api = {
  auth: {
    me: () => request<{ user: User }>('/auth/me'),
    login: (credentials: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: async () => {
      const res = await request<{ message: string }>('/auth/logout', { method: 'POST' })
      clearCsrfToken()
      return res
    },
  },
  devices: {
    list: () => request<PaginatedResponse<Device>>('/devices'),
    get: (id: string) => request<{ device: Device }>(`/devices/${id}`),
    revoke: (id: string) =>
      request<{ message: string }>(`/devices/${id}/revoke`, { method: 'POST' }),
    telemetry: (id: string) =>
      request<PaginatedResponse<Telemetry>>(`/devices/${id}/telemetry`),
  },
  challenges: {
    create: () =>
      request<EnrollmentChallenge>('/devices/enrollment-challenges', { method: 'POST' }),
    revoke: (id: string) =>
      request<{ message: string }>(`/devices/enrollment-challenges/${id}`, { method: 'DELETE' }),
  },
  health: {
    check: () => request<{ status: string }>('/health'),
  },
}
