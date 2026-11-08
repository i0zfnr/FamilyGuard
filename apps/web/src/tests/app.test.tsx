import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { App } from '../App'
import { api } from '../services/api'
import type { User, Device, EnrollmentChallenge } from '../types'

describe('Root Application Flow & Routing Integration', () => {
  const mockUser: User = { id: 1, name: 'Grace Hopper', email: 'grace@example.com' }
  const mockDevices: Device[] = [
    {
      id: 'd-101',
      device_name: 'Primary Workstation',
      platform: 'windows',
      enrollment_status: 'active',
      last_seen_at: new Date().toISOString(),
    },
  ]
  const mockChallenge: EnrollmentChallenge = {
    id: 'ch-999',
    token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    expires_at: new Date(Date.now() + 300000).toISOString(),
    enrollment_available: true,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially, then shows AuthPage when unauthenticated', async () => {
    vi.spyOn(api.auth, 'me').mockRejectedValue({ status: 401, name: 'RequestError', message: 'Unauthenticated.' })

    render(<App />)

    expect(screen.getByText(/initializing xennguard security session/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    })
  })

  it('renders DashboardPage with devices when authenticated', async () => {
    vi.spyOn(api.auth, 'me').mockResolvedValue({ user: mockUser })
    vi.spyOn(api.devices, 'list').mockResolvedValue({ data: mockDevices })
    vi.spyOn(api.devices, 'telemetry').mockResolvedValue({ data: [] })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
      expect(screen.getByText('Primary Workstation')).toBeInTheDocument()
    })
  })

  it('navigates to DeviceDetailPage when clicking Inspect Telemetry and returns back', async () => {
    vi.spyOn(api.auth, 'me').mockResolvedValue({ user: mockUser })
    vi.spyOn(api.devices, 'list').mockResolvedValue({ data: mockDevices })
    vi.spyOn(api.devices, 'telemetry').mockResolvedValue({ data: [] })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Primary Workstation')).toBeInTheDocument()
    })

    const inspectBtn = screen.getByRole('button', { name: /inspect telemetry/i })
    fireEvent.click(inspectBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to devices/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /battery discharge & charge dynamics/i })).toBeInTheDocument()
    })

    // Click back to devices
    const backBtn = screen.getByRole('button', { name: /back to devices/i })
    fireEvent.click(backBtn)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inspect telemetry/i })).toBeInTheDocument()
    })
  })

  it('opens EnrollmentModal upon clicking Pair Device and displays challenge', async () => {
    vi.spyOn(api.auth, 'me').mockResolvedValue({ user: mockUser })
    vi.spyOn(api.devices, 'list').mockResolvedValue({ data: mockDevices })
    vi.spyOn(api.devices, 'telemetry').mockResolvedValue({ data: [] })
    vi.spyOn(api.challenges, 'create').mockResolvedValue(mockChallenge)

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const pairBtn = screen.getByRole('button', { name: /pair device/i })
    await act(async () => {
      fireEvent.click(pairBtn)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enroll new device/i })).toBeInTheDocument()
      expect(screen.getByText(mockChallenge.token)).toBeInTheDocument()
    })
  })
})
