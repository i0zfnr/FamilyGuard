import { useEffect, useState, useCallback } from 'react'
import { Sidebar, Button, EnrollmentModal } from './components'
import {
  AuthPage,
  DashboardPage,
  DeviceDetailPage,
  ActivityPage,
  SecurityPage,
  SettingsPage,
} from './pages'
import { api, RequestError } from './services/api'
import type { User, Device, Telemetry, EnrollmentChallenge } from './types'
import {
  Plus,
  SignOut,
  ActivityIcon as Activity,
} from '@phosphor-icons/react'

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'devices' | 'activity' | 'security' | 'settings' | 'audit'>('devices')
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'windows'>('all')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [telemetryMap, setTelemetryMap] = useState<Record<string, Telemetry>>({})
  const [challenge, setChallenge] = useState<EnrollmentChallenge | null>(null)
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false)
  const [serverConnected, setServerConnected] = useState(true)
  const [busy, setBusy] = useState(false)
  const [errorBanner, setErrorBanner] = useState<string | null>(null)

  // Fetch devices when user is authenticated
  const loadDevices = useCallback(async () => {
    try {
      const res = await api.devices.list()
      const deviceList = res.data || []
      setDevices(deviceList)

      const latestMap: Record<string, Telemetry> = {}
      await Promise.all(
        deviceList.map(async (device) => {
          try {
            const telemetryRes = await api.devices.telemetry(device.id)
            if (telemetryRes.data && telemetryRes.data.length > 0) {
              latestMap[device.id] = telemetryRes.data[0]
            }
          } catch {
            // Non-blocking telemetry fetch
          }
        })
      )
      setTelemetryMap(latestMap)
    } catch (err) {
      setServerConnected(false)
      setErrorBanner(err instanceof Error ? err.message : 'Unable to load devices.')
    }
  }, [])

  // Initial user session check
  useEffect(() => {
    let mounted = true
    api.auth
      .me()
      .then((res) => {
        if (mounted) {
          setUser(res.user)
          setServerConnected(true)
          void loadDevices()
        }
      })
      .catch((err) => {
        if (mounted) {
          if (err instanceof RequestError && err.status === 401) {
            setUser(null)
          } else {
            setServerConnected(false)
          }
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [loadDevices])

  // Sign out handler
  const handleSignOut = async () => {
    setBusy(true)
    try {
      await api.auth.logout()
      setUser(null)
      setDevices([])
      setTelemetryMap({})
      setSelectedDevice(null)
      setChallenge(null)
      setIsEnrollmentOpen(false)
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Sign out error.')
    } finally {
      setBusy(false)
    }
  }

  // Revoke device handler
  const handleRevokeDevice = async (device: Device) => {
    setBusy(true)
    try {
      await api.devices.revoke(device.id)
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, enrollment_status: 'revoked' } : d))
      )
      if (selectedDevice?.id === device.id) {
        setSelectedDevice((prev) => (prev ? { ...prev, enrollment_status: 'revoked' } : null))
      }
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Device revocation failed.')
    } finally {
      setBusy(false)
    }
  }

  // Issue enrollment challenge & open modal
  const handlePairDevice = async () => {
    setBusy(true)
    setErrorBanner(null)
    try {
      const res = await api.challenges.create()
      setChallenge(res)
      setIsEnrollmentOpen(true)
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Could not create enrollment challenge.')
    } finally {
      setBusy(false)
    }
  }

  // Cancel enrollment challenge
  const handleCancelChallenge = async (challengeId: string) => {
    setBusy(true)
    try {
      await api.challenges.revoke(challengeId)
      setChallenge(null)
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Could not revoke challenge.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div
        className="app-canvas"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '18px',
          background: 'var(--color-canvas-bg)',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          className="brand-icon-box"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(27, 54, 38, 0.15)',
          }}
          aria-hidden="true"
        >
          <img src="/xennguard-icon.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <span style={{ fontSize: '15px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          Initializing XennGuard Security Session...
        </span>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthPage
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser)
          void loadDevices()
        }}
      />
    )
  }

  const currentTab = activeTab === 'audit' ? 'activity' : activeTab

  return (
    <div
      className="app-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-canvas-bg)',
      }}
    >
      {/* 1. Left Docked Obsidian Sidebar (matching Image 3) */}
      <Sidebar
        user={user}
        activeTab={currentTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedDevice(null)
        }}
        devices={devices}
      />

      {/* 2. Main Viewport Area (offset for 260px docked sidebar) */}
      <div
        className="app-main-viewport"
        style={{
          marginLeft: '260px',
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--color-canvas-bg)',
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            height: '64px',
            padding: '0 32px',
            background: 'rgba(247, 250, 247, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid #D7E3D9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          role="banner"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)' }}>Workspace</span>
            <span>/</span>
            <span style={{ color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
              {selectedDevice
                ? `Device: ${selectedDevice.device_name}`
                : currentTab}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="server-status-pill" title="API server connection status" role="status" aria-live="polite">
              <Activity size={14} weight="bold" className="status-dot pulse" aria-hidden="true" />
              <span>{serverConnected ? 'Connected' : 'Server unavailable'}</span>
            </div>

            <div className="user-pill" title={`${user.name} (${user.email})`}>
              <div className="user-avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span>{user.name}</span>
            </div>

            {devices.length > 0 && <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} weight="bold" />}
              onClick={handlePairDevice}
              disabled={busy}
            >
              Add device
            </Button>}

            <Button
              variant="ghost"
              size="sm"
              icon={<SignOut size={16} weight="bold" />}
              onClick={handleSignOut}
              disabled={busy}
              title="Sign out of XennGuard"
              aria-label="Sign out"
            />
          </div>
        </header>

        {/* Global Error Banner */}
        {errorBanner && (
          <div
            role="alert"
            style={{
              margin: '16px 32px 0',
              padding: '12px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-status-critical-bg)',
              border: '1px solid var(--color-status-critical-border)',
              color: '#991B1B',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 600 }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Tab View Body */}
        <main style={{ flex: 1, padding: '32px', minWidth: 0 }}>
          {selectedDevice ? (
            <DeviceDetailPage
              device={selectedDevice}
              onBack={() => {
                setSelectedDevice(null)
                void loadDevices()
              }}
              onDeviceUpdated={(updated) => {
                setSelectedDevice(updated)
                setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
              }}
            />
          ) : currentTab === 'activity' ? (
            <ActivityPage user={user} devices={devices} />
          ) : currentTab === 'security' ? (
            <SecurityPage
              user={user}
              devices={devices}
              onRevokeDevice={handleRevokeDevice}
              busy={busy}
            />
          ) : currentTab === 'settings' ? (
            <SettingsPage
              user={user}
              onSignOut={handleSignOut}
              busy={busy}
              serverConnected={serverConnected}
            />
          ) : (
            <DashboardPage
              user={user}
              devices={devices}
              telemetryMap={telemetryMap}
              platformFilter={platformFilter}
              onPlatformFilterChange={setPlatformFilter}
              onInspectDevice={(device) => setSelectedDevice(device)}
              onRevokeDevice={handleRevokeDevice}
              onPairDevice={handlePairDevice}
              serverConnected={serverConnected}
              busy={busy}
            />
          )}
        </main>
      </div>

      {/* Device Enrollment Modal */}
      <EnrollmentModal
        challenge={challenge}
        isOpen={isEnrollmentOpen}
        onClose={() => setIsEnrollmentOpen(false)}
        onCancelChallenge={handleCancelChallenge}
        busy={busy}
      />
    </div>
  )
}

export default App
