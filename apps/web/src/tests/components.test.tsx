import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import {
  Button,
  Input,
  StatusBadge,
  StatPlatter,
  HeaderPlatter,
  DeviceCard,
  TelemetryChart,
  EnrollmentModal,
} from '../components'
import type { Device, Telemetry, EnrollmentChallenge, User } from '../types'

describe('UI Components Unit Test Suite', () => {
  describe('Button Component', () => {
    it('renders with children and handles clicks', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click Me</Button>)

      const btn = screen.getByRole('button', { name: /click me/i })
      expect(btn).toBeInTheDocument()
      fireEvent.click(btn)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('renders loading spinner and disables button when loading', () => {
      render(<Button loading>Submit</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toBeDisabled()
      expect(btn.querySelector('.btn-spinner')).toBeInTheDocument()
    })

    it('applies correct variant classes', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-primary')

      rerender(<Button variant="danger">Danger</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-danger')

      rerender(<Button variant="glass">Glass</Button>)
      expect(screen.getByRole('button')).toHaveClass('btn-glass')
    })
  })

  describe('Input Component', () => {
    it('renders label, input, and handles typing', () => {
      const handleChange = vi.fn()
      render(<Input label="Email Address" id="email" value="" onChange={handleChange} />)

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'user@example.com' } })
      expect(handleChange).toHaveBeenCalledTimes(1)
    })

    it('displays error message and sets aria-invalid when error is provided', () => {
      render(<Input label="Password" id="password" error="Invalid credential format" />)

      const input = screen.getByLabelText(/password/i)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent(/invalid credential format/i)
    })
  })

  describe('StatusBadge Component', () => {
    it('renders online status with pulsing dot', () => {
      const { container } = render(<StatusBadge status="online" label="Online" pulse />)
      expect(screen.getByText('Online')).toBeInTheDocument()
      expect(container.querySelector('.status-dot.pulse')).toBeInTheDocument()
      expect(container.querySelector('.status-badge-online')).toBeInTheDocument()
    })

    it('renders critical status without pulse', () => {
      const { container } = render(<StatusBadge status="critical" label="Revoked" pulse={false} />)
      expect(screen.getByText('Revoked')).toBeInTheDocument()
      expect(container.querySelector('.status-badge-critical')).toBeInTheDocument()
    })
  })

  describe('StatPlatter Component', () => {
    it('renders device statistics summary', () => {
      render(<StatPlatter total={5} online={3} alerts={2} />)

      expect(screen.getByText('Total:')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Online:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Alerts:')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('HeaderPlatter Component', () => {
    const mockUser: User = { id: 1, name: 'Alice Smith', email: 'alice@example.com' }

    it('renders brand, navigation pills, user initial, and handles actions', () => {
      const onTabChange = vi.fn()
      const onPairDevice = vi.fn()
      const onSignOut = vi.fn()

      render(
        <HeaderPlatter
          user={mockUser}
          activeTab="devices"
          onTabChange={onTabChange}
          onPairDevice={onPairDevice}
          onSignOut={onSignOut}
        />
      )

      expect(screen.getByText('XennGuard')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument()

      const pairBtn = screen.getByRole('button', { name: /pair device/i })
      fireEvent.click(pairBtn)
      expect(onPairDevice).toHaveBeenCalledTimes(1)

      const auditTab = screen.getByRole('button', { name: /audit logs/i })
      fireEvent.click(auditTab)
      expect(onTabChange).toHaveBeenCalledWith('audit')

      const signOutBtn = screen.getByLabelText(/sign out/i)
      fireEvent.click(signOutBtn)
      expect(onSignOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('DeviceCard Component', () => {
    const mockDevice: Device = {
      id: 'dev-uuid-1234',
      device_name: 'Galaxy S24 Ultra',
      platform: 'android',
      enrollment_status: 'active',
      last_seen_at: new Date().toISOString(),
    }

    const mockTelemetry: Telemetry = {
      battery_percentage: 84,
      charging: true,
      storage_total: 128 * 1024 * 1024 * 1024,
      storage_available: 64 * 1024 * 1024 * 1024,
      network_type: 'wifi',
      recorded_at: new Date().toISOString(),
    }

    it('renders device details, battery level, storage, and triggers inspect', () => {
      const onInspect = vi.fn()
      const onRevoke = vi.fn().mockResolvedValue(undefined)

      render(
        <DeviceCard
          device={mockDevice}
          latestTelemetry={mockTelemetry}
          onInspect={onInspect}
          onRevoke={onRevoke}
        />
      )

      expect(screen.getByText('Galaxy S24 Ultra')).toBeInTheDocument()
      expect(screen.getByText('Android Device')).toBeInTheDocument()
      expect(screen.getByText(/84%/)).toBeInTheDocument()
      expect(screen.getByText(/Charging/i)).toBeInTheDocument()
      expect(screen.getByText(/64.0 GiB free/i)).toBeInTheDocument()

      const inspectBtn = screen.getByRole('button', { name: /inspect telemetry/i })
      fireEvent.click(inspectBtn)
      expect(onInspect).toHaveBeenCalledWith(mockDevice)
    })

    it('handles device revocation with user confirmation', async () => {
      const onInspect = vi.fn()
      const onRevoke = vi.fn().mockResolvedValue(undefined)
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(
        <DeviceCard
          device={mockDevice}
          latestTelemetry={mockTelemetry}
          onInspect={onInspect}
          onRevoke={onRevoke}
        />
      )

      const revokeBtn = screen.getByRole('button', { name: /revoke/i })
      await act(async () => {
        fireEvent.click(revokeBtn)
      })
      expect(window.confirm).toHaveBeenCalled()
      expect(onRevoke).toHaveBeenCalledWith(mockDevice)
    })
  })

  describe('TelemetryChart Component', () => {
    const mockTelemetryHistory: Telemetry[] = [
      {
        id: 1,
        battery_percentage: 95,
        charging: false,
        storage_total: 64 * 1024 * 1024 * 1024,
        storage_available: 32 * 1024 * 1024 * 1024,
        network_type: 'wifi',
        recorded_at: '2026-11-08T18:00:00Z',
      },
      {
        id: 2,
        battery_percentage: 82,
        charging: false,
        storage_total: 64 * 1024 * 1024 * 1024,
        storage_available: 32 * 1024 * 1024 * 1024,
        network_type: 'cellular',
        recorded_at: '2026-11-08T18:30:00Z',
      },
    ]

    it('renders battery spline, storage progress bar, and network connectivity log', () => {
      render(<TelemetryChart data={mockTelemetryHistory} deviceName="Galaxy S24" />)

      expect(screen.getByText(/battery discharge & charge dynamics/i)).toBeInTheDocument()
      expect(screen.getByText(/hardware storage allocation/i)).toBeInTheDocument()
      expect(screen.getByText(/network connectivity log/i)).toBeInTheDocument()
      expect(screen.getByText('50% Used')).toBeInTheDocument()
      expect(screen.getAllByText(/32.0 GiB/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/cellular/i)).toBeInTheDocument()
    })
  })

  describe('EnrollmentModal Component', () => {
    const mockChallenge: EnrollmentChallenge = {
      id: 'challenge-uuid-5678',
      token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      enrollment_available: true,
    }

    it('renders QR code matrix, timer, token string, and gates completion on consent', () => {
      const onClose = vi.fn()
      const onCancelChallenge = vi.fn().mockResolvedValue(undefined)

      render(
        <EnrollmentModal
          challenge={mockChallenge}
          isOpen={true}
          onClose={onClose}
          onCancelChallenge={onCancelChallenge}
        />
      )

      expect(screen.getByText(/enroll new device/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/cryptographic pairing qr code/i)).toBeInTheDocument()
      expect(screen.getByText(mockChallenge.token)).toBeInTheDocument()
      expect(screen.getByText(/expires in/i)).toBeInTheDocument()

      const doneBtn = screen.getByRole('button', { name: /done/i })
      expect(doneBtn).toBeDisabled()

      // Check consent box
      const consentCheckbox = screen.getByRole('checkbox', { name: /device owner consent verification/i })
      fireEvent.click(consentCheckbox)
      expect(doneBtn).not.toBeDisabled()

      fireEvent.click(doneBtn)
      expect(onClose).toHaveBeenCalled()
    })

    it('triggers cancel challenge when clicked', () => {
      const onClose = vi.fn()
      const onCancelChallenge = vi.fn().mockResolvedValue(undefined)

      render(
        <EnrollmentModal
          challenge={mockChallenge}
          isOpen={true}
          onClose={onClose}
          onCancelChallenge={onCancelChallenge}
        />
      )

      const cancelBtn = screen.getByRole('button', { name: /cancel challenge/i })
      fireEvent.click(cancelBtn)
      expect(onCancelChallenge).toHaveBeenCalledWith(mockChallenge.id)
    })
  })
})
