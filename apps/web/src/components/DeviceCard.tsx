import { useState } from 'react'
import {
  DeviceMobileCamera,
  Desktop,
  BatteryCharging,
  BatteryHigh,
  HardDrive,
  ChartLineUp,
  Prohibit,
  Clock,
} from '@phosphor-icons/react'
import { StatusBadge, type StatusType } from './StatusBadge'
import { Button } from './Button'
import type { Device, Telemetry } from '../types'

export interface DeviceCardProps {
  device: Device
  latestTelemetry?: Telemetry | null
  onInspect: (device: Device) => void
  onRevoke: (device: Device) => Promise<void>
  busy?: boolean
}

export function DeviceCard({
  device,
  latestTelemetry,
  onInspect,
  onRevoke,
  busy = false,
}: DeviceCardProps) {
  const [revoking, setRevoking] = useState(false)
  const [now] = useState(() => Date.now())

  const getStatus = (): StatusType => {
    if (device.enrollment_status === 'revoked') return 'critical'
    if (!device.last_seen_at) return 'neutral'
    const lastSeenTime = new Date(device.last_seen_at).getTime()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    if (lastSeenTime > fiveMinutesAgo) {
      if (latestTelemetry?.battery_percentage != null && latestTelemetry.battery_percentage < 15) {
        return 'warning'
      }
      return 'online'
    }
    return 'warning'
  }

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      `Revoke cryptographic credentials for "${device.device_name}"?\n\nThe device will no longer be able to report telemetry until re-enrolled with mutual consent.`
    )
    if (!confirmed) return

    setRevoking(true)
    try {
      await onRevoke(device)
    } finally {
      setRevoking(false)
    }
  }

  const status = getStatus()
  const isAndroid = device.platform === 'android'
  const PlatformIcon = isAndroid ? DeviceMobileCamera : Desktop

  // Format storage
  const storageStr =
    latestTelemetry?.storage_available != null
      ? `${(latestTelemetry.storage_available / (1024 * 1024 * 1024)).toFixed(1)} GiB free`
      : 'Storage unmeasured'

  // Format battery
  const batteryPercent = latestTelemetry?.battery_percentage
  const isCharging = latestTelemetry?.charging

  return (
    <article
      className="device-row"
      aria-labelledby={`device-${device.id}-title`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-surface-card-border)',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '12px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Device Info & Platform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
        <div
          className="platform-icon-box"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: isAndroid ? '#EAF2EB' : '#EEF4F8',
            border: isAndroid ? '1px solid #CFDCD2' : '1px solid #D2E0EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAndroid ? '#275C37' : '#23527C',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <PlatformIcon size={20} weight="regular" />
        </div>

        <div>
          <h3
            id={`device-${device.id}-title`}
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: '0 0 2px',
              letterSpacing: '-0.02em',
            }}
          >
            {device.device_name}
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {device.platform === 'android' ? 'Android Device' : 'Windows Workstation'}
          </span>
        </div>
      </div>

      {/* Telemetry Snapshot Metrics */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          flexWrap: 'wrap',
        }}
      >
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isCharging ? (
            <BatteryCharging size={16} weight="bold" color="#1E824C" aria-hidden="true" />
          ) : (
            <BatteryHigh size={16} weight="regular" aria-hidden="true" />
          )}
          <span>{batteryPercent != null ? `${batteryPercent}%` : 'No battery metric'}</span>
          {isCharging && <span>(Charging)</span>}
        </div>

        {/* Storage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HardDrive size={16} weight="regular" aria-hidden="true" />
          <span>{storageStr}</span>
        </div>

        {/* Last Seen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <Clock size={14} weight="regular" aria-hidden="true" />
          <span>{device.last_seen_at ? 'Active recently' : 'Never reported'}</span>
        </div>
      </div>

      {/* Status & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StatusBadge
          status={status}
          label={
            device.enrollment_status === 'revoked'
              ? 'Revoked'
              : status === 'online'
                ? 'Online'
                : 'Warning'
          }
          pulse={status === 'online'}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={<ChartLineUp size={14} weight="bold" />}
          onClick={() => onInspect(device)}
          disabled={busy || revoking}
        >
          Inspect Telemetry
        </Button>

        {device.enrollment_status !== 'revoked' && (
          <Button
            variant="danger"
            size="sm"
            icon={<Prohibit size={14} weight="bold" />}
            onClick={handleRevoke}
            loading={revoking}
            disabled={busy || revoking}
          >
            Revoke
          </Button>
        )}
      </div>
    </article>
  )
}
