import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, request, clearCsrfToken } from '../services/api'

describe('API Service Client Test Suite', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    clearCsrfToken()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('automatically acquires CSRF token before executing non-GET requests', async () => {
    const mockCsrfToken = 'test-csrf-token-12345'
    const fetchMock = vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url === '/api/v1/csrf') {
        return Promise.resolve(
          new Response(JSON.stringify({ csrf_token: mockCsrfToken }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (url === '/api/v1/auth/login') {
        const headers = options?.headers as Record<string, string>
        expect(headers['X-CSRF-TOKEN']).toBe(mockCsrfToken)
        expect(headers['Content-Type']).toBe('application/json')
        return Promise.resolve(
          new Response(
            JSON.stringify({ user: { id: 1, name: 'Alice', email: 'alice@example.com' } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        )
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`))
    })

    global.fetch = fetchMock

    const res = await api.auth.login({ email: 'alice@example.com', password: 'secretpassword123' })
    expect(res.user.email).toBe('alice@example.com')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/csrf', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/auth/login', expect.anything())
  })

  it('retries once if server responds with 419 CSRF Token Mismatch', async () => {
    let csrfCount = 0
    let postCount = 0

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/csrf') {
        csrfCount++
        return Promise.resolve(
          new Response(JSON.stringify({ csrf_token: `token-${csrfCount}` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        )
      }
      if (url === '/api/v1/devices/1/revoke') {
        postCount++
        if (postCount === 1) {
          return Promise.resolve(new Response(JSON.stringify({ message: 'CSRF token mismatch.' }), { status: 419 }))
        }
        return Promise.resolve(new Response(JSON.stringify({ message: 'Device access revoked.' }), { status: 200 }))
      }
      return Promise.reject(new Error(`Unhandled request: ${url}`))
    })

    global.fetch = fetchMock

    const res = await api.devices.revoke('1')
    expect(res.message).toBe('Device access revoked.')
    expect(csrfCount).toBe(2)
    expect(postCount).toBe(2)
  })

  it('throws RequestError with consolidated validation error message on 422', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/v1/csrf') {
        return Promise.resolve(new Response(JSON.stringify({ csrf_token: 'valid-csrf' }), { status: 200 }))
      }
      return Promise.resolve(
        new Response(
          JSON.stringify({
            message: 'The given data was invalid.',
            errors: {
              email: ['The email field is required.'],
              password: ['The password must be at least 12 characters.'],
            },
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        )
      )
    })

    await expect(request('/auth/register', { method: 'POST' })).rejects.toThrow(
      'The email field is required. The password must be at least 12 characters.'
    )
  })

  it('does not submit credentials when the CSRF endpoint returns 502', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 }))
    global.fetch = fetchMock

    await expect(api.auth.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'a long secure password',
      password_confirmation: 'a long secure password',
    })).rejects.toThrow(/API server is unavailable \(HTTP 502\)/i)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/csrf', expect.anything())
  })

  it('shows a clear service-unavailable message for a 502 health response', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))

    await expect(api.health.check()).rejects.toThrow(/API server is unavailable \(HTTP 502\)/i)
  })

  it('explains when the browser cannot connect to the API at all', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(api.health.check()).rejects.toThrow(/Cannot reach XennGuard’s API server/i)
  })

  it('correctly executes GET endpoints without fetching CSRF', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'dev-1', device_name: 'Test Phone' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    global.fetch = fetchMock

    const res = await api.devices.list()
    expect(res.data).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/devices',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/json' }),
      })
    )
  })

  it('correctly invokes health check endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const res = await api.health.check()
    expect(res.status).toBe('ok')
  })
})
