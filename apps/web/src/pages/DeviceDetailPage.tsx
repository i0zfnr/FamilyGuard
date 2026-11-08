import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  DeviceMobileCamera,
  Desktop,
  ArrowsClockwise,
  Prohibit,
  Clock,
  BatteryCharging,
  BatteryHigh,
  HardDrive,
  WifiHigh,
} from '@phosphor-icons/react'
import { Button, StatusBadge, TelemetryChart, type StatusType } from '../components'
import type { Device, Telemetry } from '../types'
import { api, RequestError } from '../services/api'

export interface DeviceDetailPageProps {
  device: Device
  onBack: () => void
  onDeviceUpdated?: (updated: Device) => void
}

export function DeviceDetailPage({
  device: initialDevice,
  onBack,
  onDeviceUpdated,
}: DeviceDetailPageProps) {
  const [device, setDevice] = useState<Device>(initialDevice)
  const [telemetry, setTelemetry] = useState<Telemetry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [error, setError] = useState('')

  const fetchTelemetry = async () => {
    try {
      const res = await api.devices.telemetry(device.id)
      setTelemetry(res.data)
    } catch (err) {
      if (err instanceof RequestError) {
        setError(err.message)
      } else {
        setError('Failed to load device telemetry.')
      }
    }
  }

  useEffect(() => {
    let mounted = true
    const init = async () => {
      setLoading(true)
      try {
        const res = await api.devices.telemetry(device.id)
        if (mounted) setTelemetry(res.data)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load telemetry history.')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [device.id])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError('')
    try {
      await fetchTelemetry()
    } finally {
      setRefreshing(false)
    }
  }

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to revoke credentials for "${device.device_name}"?\n\nThis will invalidate all bearer tokens and prevent the device from connecting.`
    )
    if (!confirmed) return

    setRevoking(true)
    try {
      await api.devices.revoke(device.id)
      const updated: Device = { ...device, enrollment_status: 'revoked' }
      setDevice(updated)
      if (onDeviceUpdated) onDeviceUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revocation failed.')
    } finally {
      setRevoking(false)
    }
  }

  const [now] = useState(() => Date.now())

  const getStatus = (): StatusType => {
    if (device.enrollment_status === 'revoked') return 'critical'
    if (!device.last_seen_at) return 'neutral'
    const lastSeenTime = new Date(device.last_seen_at).getTime()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    return lastSeenTime > fiveMinutesAgo ? 'online' : 'warning'
  }

  const status = getStatus()
  const isAndroid = device.platform === 'android'
  const PlatformIcon = isAndroid ? DeviceMobileCamera : Desktop

  return (
    <div className="content-wrapper" style={{ paddingTop: '108px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <Button
          variant="glass"
          size="sm"
          icon={<ArrowLeft size={16} weight="bold" />}
          onClick={onBack}
        >
          Back to Devices
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowsClockwise size={15} weight="bold" className={refreshing ? 'btn-spinner' : ''} />}
            onClick={handleRefresh}
            loading={refreshing}
            disabled={loading}
          >
            Refresh Telemetry
          </Button>

          {device.enrollment_status !== 'revoked' && (
            <Button
              variant="danger"
              size="sm"
              icon={<Prohibit size={15} weight="bold" />}
              onClick={handleRevoke}
              loading={revoking}
            >
              Revoke Access
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-status-critical-bg)',
            border: '1px solid var(--color-status-critical-border)',
            color: '#991B1B',
            fontSize: '14px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* Device Overview Banner */}
      <section
        className="solid-card"
        style={{
          marginBottom: '32px',
          padding: '24px 28px',
          background: '#FFFFFF',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-labelledby="device-detail-title"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              className="platform-icon-box"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                background: isAndroid ? '#EAF2EB' : '#EEF4F8',
                border: isAndroid ? '1px solid #CFDCD2' : '1px solid #D2E0EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isAndroid ? '#275C37' : '#23527C',
              }}
              aria-hidden="true"
            >
              <PlatformIcon size={28} weight="regular" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h2 id="device-detail-title" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  {device.device_name}
                </h2>
                <StatusBadge status={status} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {device.platform === 'android' ? 'Android Mobile Client' : 'Windows DPAPI Agent'}
                <span style={{ margin: '0 8px' }}>·</span>
                <span>UUID: {device.id}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} weight="regular" aria-hidden="true" />
              <span>
                Last heartbeat:{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>
                  {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Telemetry Visualizer Suite */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading telemetry data stream...
        </div>
      ) : (
        <>
          <TelemetryChart data={telemetry} deviceName={device.device_name} />

          {/* Historical Data Table */}
          <section
            className="solid-card"
            style={{
              marginTop: '24px',
              padding: '24px 28px',
              background: '#FFFFFF',
              border: '1px solid var(--color-surface-card-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
            aria-labelledby="telemetry-table-heading"
          >
            <h4 id="telemetry-table-heading" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '18px', letterSpacing: '-0.02em' }}>
              Telemetry Record History
            </h4>

            {telemetry.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', margin: 0 }}>
                No telemetry snapshots recorded for this device yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2ECE4', color: 'var(--color-text-secondary)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Recorded At</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Battery</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Storage Free</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Network Interface</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.map((t, idx) => (
                      <tr
                        key={t.id || idx}
                        style={{
                          borderBottom: '1px solid #EDF3EE',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {new Date(t.recorded_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {t.charging ? (
                              <BatteryCharging size={16} weight="bold" color="#1E824C" aria-hidden="true" />
                            ) : (
                              <BatteryHigh size={16} weight="regular" aria-hidden="true" />
                            )}
                            {t.battery_percentage != null ? `${t.battery_percentage}%` : 'N/A'}
                            {t.charging ? ' (Charging)' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <HardDrive size={15} weight="regular" aria-hidden="true" />
                            {t.storage_available != null
                              ? `${(t.storage_available / (1024 * 1024 * 1024)).toFixed(1)} GiB`
                              : 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                            <WifiHigh size={15} weight="regular" aria-hidden="true" />
                            {t.network_type ?? 'none'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
