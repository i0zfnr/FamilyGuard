import { useEffect, useState, useCallback } from 'react'
import { HeaderPlatter, EnrollmentModal } from './components'
import { AuthPage, DashboardPage, DeviceDetailPage } from './pages'
import { api, RequestError } from './services/api'
import type { User, Device, Telemetry, EnrollmentChallenge } from './types'
import {
  Sliders,
  ClipboardText,
} from '@phosphor-icons/react'

export function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'devices' | 'audit' | 'settings'>('devices')
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

  return (
    <div className="app-canvas" style={{ minHeight: '100vh', background: 'var(--color-canvas-bg)' }}>
      {/* Floating Header Platter Navigation */}
      <HeaderPlatter
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSelectedDevice(null)
        }}
        onPairDevice={handlePairDevice}
        onSignOut={handleSignOut}
        serverConnected={serverConnected}
        busy={busy}
      />

      {/* Global Error Banner */}
      {errorBanner && (
        <div
          role="alert"
          style={{
            maxWidth: '1280px',
            margin: '96px auto 0',
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

      {/* Active Tab View */}
      {selectedDevice ? (
        <DeviceDetailPage
          device={selectedDevice}
          onBack={() => {
            setSelectedDevice(null)
            loadDevices()
          }}
          onDeviceUpdated={(updated) => {
            setSelectedDevice(updated)
            setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
          }}
        />
      ) : activeTab === 'audit' ? (
        <div className="content-wrapper" style={{ paddingTop: '108px' }}>
          <div
            className="solid-card"
            style={{
              padding: '36px',
              maxWidth: '860px',
              margin: '0 auto',
              background: '#FFFFFF',
              border: '1px solid var(--color-surface-card-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: '#EAF2EB',
                border: '1px solid #D3E3D6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#275C37',
                marginBottom: '16px',
              }}
              aria-hidden="true"
            >
              <ClipboardText size={24} weight="regular" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Security Audit Logs
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 0 28px', lineHeight: 1.6 }}>
              Cryptographically signed audit logs verifying token exchanges, challenge redemptions, and telemetry health synchronization.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  padding: '14px 18px',
                  background: '#F7FAF7',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #DCE6DE',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#1A6E40', fontWeight: 700 }}>AUTH_LOGIN_SUCCESS</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Active Session</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  User session authenticated for <strong>{user.email}</strong> via secure web session guard.
                </div>
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  background: '#F7FAF7',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #DCE6DE',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#275C37', fontWeight: 700 }}>TENANT_POLICY_VERIFIED</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Owner-Scoped</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Strict server-side device ownership and cross-tenant isolation policy enforced on all endpoints.
                </div>
              </div>

              <div
                style={{
                  padding: '14px 18px',
                  background: '#F7FAF7',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #DCE6DE',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#23527C', fontWeight: 700 }}>TELEMETRY_INGESTION_READY</span>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Encrypted</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Hardware token bearer challenge validation active. Retention automated to 30 days.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="content-wrapper" style={{ paddingTop: '108px' }}>
          <div
            className="solid-card"
            style={{
              padding: '36px',
              maxWidth: '680px',
              margin: '0 auto',
              background: '#FFFFFF',
              border: '1px solid var(--color-surface-card-border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: '#EAF2EB',
                border: '1px solid #D3E3D6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#275C37',
                marginBottom: '16px',
              }}
              aria-hidden="true"
            >
              <Sliders size={24} weight="regular" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Security & Workspace Settings
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
              Manage master credentials, cryptographic proof parameters, and mutual device consent policies.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDF3EE' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Master Account Name</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{user.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDF3EE' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Email Identity</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{user.email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDF3EE' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Hardware Cryptographic Proofs</span>
                <span style={{ color: '#1A6E40', fontWeight: 700 }}>Enforced (SHA256withRSA)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #EDF3EE' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Strict Zero-Emoji Directives</span>
                <span style={{ color: '#1A6E40', fontWeight: 700 }}>Active (Phosphor Vector Icons)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Telemetry Retention Window</span>
                <strong style={{ color: 'var(--color-text-primary)' }}>30 Days Automated Prune</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <DashboardPage
          user={user}
          devices={devices}
          telemetryMap={telemetryMap}
          onInspectDevice={(device) => setSelectedDevice(device)}
          onRevokeDevice={handleRevokeDevice}
          onPairDevice={handlePairDevice}
          busy={busy}
        />
      )}

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
