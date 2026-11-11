import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, RequestError } from '../services/api'

const supabaseMocks = vi.hoisted(() => {
  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  }
  profileQuery.select.mockReturnValue(profileQuery)
  profileQuery.eq.mockReturnValue(profileQuery)
  return {
    profileQuery,
    client: {
      auth: {
        getSession: vi.fn(),
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => profileQuery),
    },
  }
})

vi.mock('../services/supabase', () => ({
  getSupabaseClient: () => supabaseMocks.client,
  getSupabaseFunctionUrl: () => 'https://project.supabase.co/functions/v1/xennguard-api',
  getSupabasePublishableKey: () => 'sb_publishable_test_key',
}))

describe('Supabase API client', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    supabaseMocks.client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    supabaseMocks.profileQuery.single.mockResolvedValue({
      data: { id: 'user-1', name: 'Alice', role: 'device_owner', mfa_enabled: false, created_at: '2026-01-01T00:00:00Z' },
      error: null,
    })
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('signs in with Supabase Auth and loads the owner profile', async () => {
    const authUser = { id: 'user-1', email: 'alice@example.com' }
    supabaseMocks.client.auth.signInWithPassword.mockResolvedValue({ data: { user: authUser }, error: null })

    const result = await api.auth.login({ email: authUser.email, password: 'securepassword123' })

    expect(result.user).toMatchObject({ id: 'user-1', name: 'Alice', email: authUser.email, role: 'device_owner' })
    expect(supabaseMocks.client.auth.signInWithPassword).toHaveBeenCalledWith({ email: authUser.email, password: 'securepassword123' })
  })

  it('does not reveal whether an email is already registered', async () => {
    supabaseMocks.client.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    await expect(api.auth.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'a long secure password',
      password_confirmation: 'a long secure password',
    })).rejects.toThrow('Unable to create an account with these details. Try signing in or use another email address.')
  })

  it('asks new users to confirm their email when Supabase has no session yet', async () => {
    supabaseMocks.client.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'alice@example.com' }, session: null },
      error: null,
    })

    const response = await api.auth.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'a long secure password',
      password_confirmation: 'a long secure password',
    })

    expect(response.confirmationRequired).toBe(true)
    expect(response.user).toBeUndefined()
    expect(supabaseMocks.client.auth.signUp).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'a long secure password',
      options: {
        data: { name: 'Alice' },
        emailRedirectTo: window.location.origin,
      },
    })
  })

  it('sends the user JWT and publishable key to protected functions', async () => {
    supabaseMocks.client.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'user-jwt' } },
      error: null,
    })
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }))

    await api.devices.list()

    const [url, options] = vi.mocked(global.fetch).mock.calls[0]
    const headers = new Headers(options?.headers)
    expect(url).toBe('https://project.supabase.co/functions/v1/xennguard-api/api/v1/devices')
    expect(headers.get('apikey')).toBe('sb_publishable_test_key')
    expect(headers.get('Authorization')).toBe('Bearer user-jwt')
  })

  it('sends the public key as gateway authorization when no user session exists', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }))

    await api.health.check()

    const [, options] = vi.mocked(global.fetch).mock.calls[0]
    const headers = new Headers(options?.headers)
    expect(headers.get('Authorization')).toBe('Bearer sb_publishable_test_key')
    expect(headers.get('apikey')).toBe('sb_publishable_test_key')
  })

  it('reports service failures without claiming signup succeeded', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 }))

    await expect(api.health.check()).rejects.toMatchObject({
      name: 'RequestError',
      status: 502,
      message: 'XennGuard’s data service is unavailable (HTTP 502). Try again later.',
    })
  })

  it('explains when the service cannot be reached', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(api.health.check()).rejects.toThrow(/Cannot reach XennGuard’s data service/i)
  })

  it('signs out through Supabase Auth', async () => {
    supabaseMocks.client.auth.signOut.mockResolvedValue({ error: null })

    await expect(api.auth.logout()).resolves.toEqual({ message: 'Signed out.' })
    expect(supabaseMocks.client.auth.signOut).toHaveBeenCalledOnce()
  })

  it('keeps request errors typed for auth state handling', async () => {
    const error = new RequestError('Unauthenticated.', 401)
    expect(error.status).toBe(401)
    expect(error.name).toBe('RequestError')
  })
})
