import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthPage, DashboardPage, DeviceDetailPage } from '../pages'
import type { User, Device, Telemetry } from '../types'
import { api } from '../services/api'

describe('Page Views Unit & Integration Test Suite', () => {
  describe('AuthPage View', () => {
    it('renders sign in form by default and toggles to registration mode', () => {
      const onAuth = vi.fn()
      render(<AuthPage onAuthenticated={onAuth} />)

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument()

      const switchBtn = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(switchBtn)

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('enforces 12-character minimum password policy on registration', async () => {
      const onAuth = vi.fn()
      render(<AuthPage onAuthenticated={onAuth} />)

      // Switch to register
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Bob' } })
      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'bob@example.com' } })
      fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'shortpass' } })
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'shortpass' } })

      const submitBtn = screen.getByRole('button', { name: /create master account/i })
      fireEvent.click(submitBtn)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(/at least 12 characters/i)
      expect(onAuth).not.toHaveBeenCalled()
    })

    it('submits login credentials and calls onAuthenticated callback', async () => {
      const onAuth = vi.fn()
      const mockUser: User = { id: 10, name: 'Charlie', email: 'charlie@example.com' }
      vi.spyOn(api.auth, 'login').mockResolvedValue({ user: mockUser })

      render(<AuthPage onAuthenticated={onAuth} />)

      fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'charlie@example.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'securepassword123' } })

      const submitBtn = screen.getByRole('button', { name: /sign in to workspace/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(onAuth).toHaveBeenCalledWith(mockUser)
      })
    })
  })

  describe('DashboardPage View', () => {
    const mockUser: User = { id: 1, name: 'Alice', email: 'alice@example.com' }
    const mockDevices: Device[] = [
      {
        id: 'dev-1',
        device_name: 'Work Laptop',
        platform: 'windows',
        enrollment_status: 'active',
        last_seen_at: new Date().toISOString(),
      },
      {
        id: 'dev-2',
        device_name: 'Personal Pixel',
        platform: 'android',
        enrollment_status: 'active',
        last_seen_at: new Date().toISOString(),
      },
    ]

    it('renders device cards, metric platter, and filters by platform', () => {
      const onInspect = vi.fn()
      const onRevoke = vi.fn().mockResolvedValue(undefined)
      const onPair = vi.fn()

      render(
        <DashboardPage
          user={mockUser}
          devices={mockDevices}
          onInspectDevice={onInspect}
          onRevokeDevice={onRevoke}
          onPairDevice={onPair}
        />
      )

      expect(screen.getByText(/good to see you/i)).toBeInTheDocument()
      expect(screen.getByText('Work Laptop')).toBeInTheDocument()
      expect(screen.getByText('Personal Pixel')).toBeInTheDocument()

      // Filter to Android only
      const androidTab = screen.getByRole('button', { name: /^android$/i })
      fireEvent.click(androidTab)

      expect(screen.queryByText('Work Laptop')).not.toBeInTheDocument()
      expect(screen.getByText('Personal Pixel')).toBeInTheDocument()

      // Filter back to all
      const allTab = screen.getByRole('button', { name: /^all devices/i })
      fireEvent.click(allTab)
      expect(screen.getByText('Work Laptop')).toBeInTheDocument()
    })

    it('filters devices dynamically via search input', () => {
      render(
        <DashboardPage
          user={mockUser}
          devices={mockDevices}
          onInspectDevice={vi.fn()}
          onRevokeDevice={vi.fn().mockResolvedValue(undefined)}
          onPairDevice={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search devices/i)
      fireEvent.change(searchInput, { target: { value: 'Laptop' } })

      expect(screen.getByText('Work Laptop')).toBeInTheDocument()
      expect(screen.queryByText('Personal Pixel')).not.toBeInTheDocument()
    })

    it('renders empty state illustration when user has zero devices', () => {
      const onPair = vi.fn()
      render(
        <DashboardPage
          user={mockUser}
          devices={[]}
          onInspectDevice={vi.fn()}
          onRevokeDevice={vi.fn().mockResolvedValue(undefined)}
          onPairDevice={onPair}
        />
      )

      expect(screen.getByRole('heading', { name: /connect your first phone/i })).toBeInTheDocument()
      expect(screen.getByRole('list', { name: /setup steps/i })).toBeInTheDocument()
      const pairFirstBtn = screen.getByRole('button', { name: /start setup/i })
      fireEvent.click(pairFirstBtn)
      expect(onPair).toHaveBeenCalled()
    })

    it('explains server outage and disables setup while disconnected', () => {
      render(
        <DashboardPage
          user={mockUser}
          devices={[]}
          serverConnected={false}
          onInspectDevice={vi.fn()}
          onRevokeDevice={vi.fn().mockResolvedValue(undefined)}
          onPairDevice={vi.fn()}
        />
      )

      expect(screen.getByRole('status')).toHaveTextContent(/cannot reach its server/i)
      expect(screen.getByRole('button', { name: /start setup/i })).toBeDisabled()
      expect(screen.queryByRole('region', { name: /device statistics/i })).not.toBeInTheDocument()
    })
  })

  describe('DeviceDetailPage View', () => {
    const mockDevice: Device = {
      id: 'device-test-999',
      device_name: 'Secured Tablet',
      platform: 'android',
      enrollment_status: 'active',
      last_seen_at: '2026-11-08T18:00:00Z',
    }

    const mockTelemetry: Telemetry[] = [
      {
        id: 1,
        battery_percentage: 91,
        charging: true,
        storage_total: 64 * 1024 * 1024 * 1024,
        storage_available: 48 * 1024 * 1024 * 1024,
        network_type: 'wifi',
        recorded_at: '2026-11-08T18:00:00Z',
      },
    ]

    it('loads telemetry snapshots and allows returning to dashboard', async () => {
      const onBack = vi.fn()
      vi.spyOn(api.devices, 'telemetry').mockResolvedValue({ data: mockTelemetry })

      render(<DeviceDetailPage device={mockDevice} onBack={onBack} />)

      expect(await screen.findByText('Secured Tablet')).toBeInTheDocument()
      expect(screen.getByText(/battery discharge & charge dynamics/i)).toBeInTheDocument()
      expect(screen.getByText(/telemetry record history/i)).toBeInTheDocument()

      const backBtn = screen.getByRole('button', { name: /back to devices/i })
      fireEvent.click(backBtn)
      expect(onBack).toHaveBeenCalled()
    })
  })
})
