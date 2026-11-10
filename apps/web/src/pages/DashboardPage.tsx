import { useState, useMemo } from 'react'
import {
  MagnifyingGlass,
  Plus,
  ShieldPlus,
} from '@phosphor-icons/react'
import { DeviceCard, StatPlatter, Button } from '../components'
import type { User, Device, Telemetry } from '../types'

export interface DashboardPageProps {
  user: User
  devices: Device[]
  telemetryMap?: Record<string, Telemetry>
  onInspectDevice: (device: Device) => void
  onRevokeDevice: (device: Device) => Promise<void>
  onPairDevice: () => void
  serverConnected?: boolean
  platformFilter?: 'all' | 'android' | 'windows'
  onPlatformFilterChange?: (filter: 'all' | 'android' | 'windows') => void
  busy?: boolean
}

export function DashboardPage({
  user,
  devices,
  telemetryMap = {},
  onInspectDevice,
  onRevokeDevice,
  onPairDevice,
  serverConnected = true,
  platformFilter: platformFilterProp,
  onPlatformFilterChange,
  busy = false,
}: DashboardPageProps) {
  const [localFilter, setLocalFilter] = useState<'all' | 'android' | 'windows'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [now] = useState(() => Date.now())

  const activeFilter = platformFilterProp ?? localFilter

  const setFilter = (filter: 'all' | 'android' | 'windows') => {
    setLocalFilter(filter)
    if (onPlatformFilterChange) onPlatformFilterChange(filter)
  }

  // Calculate metrics for StatPlatter
  const metrics = useMemo(() => {
    let onlineCount = 0
    let alertCount = 0
    const fiveMinutesAgo = now - 5 * 60 * 1000

    devices.forEach((d) => {
      if (d.enrollment_status === 'revoked') {
        alertCount++
      } else if (d.last_seen_at) {
        const time = new Date(d.last_seen_at).getTime()
        if (time > fiveMinutesAgo) {
          onlineCount++
        } else {
          alertCount++
        }
      } else {
        alertCount++
      }
    })

    return {
      total: devices.length,
      online: onlineCount,
      alerts: alertCount,
    }
  }, [devices, now])

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      if (activeFilter !== 'all' && device.platform !== activeFilter) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          device.device_name.toLowerCase().includes(query) ||
          device.platform.toLowerCase().includes(query) ||
          device.id.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [devices, activeFilter, searchQuery])

  return (
    <div
      className="dashboard-container"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#265C38',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            FAMILY DEVICE CARE / WORKSPACE OVERVIEW
          </span>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              margin: '0 0 6px',
            }}
          >
            Devices
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            Manage your trusted devices (Good to see you, {user.name})
          </p>
        </div>

      </div>

      {devices.length > 0 && (
        <StatPlatter
          total={metrics.total}
          online={metrics.online}
          alerts={metrics.alerts}
        />
      )}

      {/* Filter & Search Bar */}
      {devices.length > 0 && <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Platform Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#EDF3EE',
            padding: '4px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid #DCE6DE',
          }}
        >
          <button
            type="button"
            onClick={() => setFilter('all')}
            style={{
              border: 'none',
              background: activeFilter === 'all' ? '#1B3626' : 'transparent',
              color: activeFilter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
              All devices
          </button>
          <button
            type="button"
            onClick={() => setFilter('android')}
            style={{
              border: 'none',
              background: activeFilter === 'android' ? '#1B3626' : 'transparent',
              color: activeFilter === 'android' ? '#FFFFFF' : 'var(--color-text-secondary)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Android
          </button>
          <button
            type="button"
            onClick={() => setFilter('windows')}
            style={{
              border: 'none',
              background: activeFilter === 'windows' ? '#1B3626' : 'transparent',
              color: activeFilter === 'windows' ? '#FFFFFF' : 'var(--color-text-secondary)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Windows
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <MagnifyingGlass
            size={16}
            color="var(--color-text-muted)"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search devices"
            placeholder="Search devices"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 14px 8px 36px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--color-surface-input-border)',
              fontSize: '13px',
              background: '#FFFFFF',
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'all var(--transition-fast)',
            }}
          />
        </div>
      </div>}

      {/* Devices List or Empty State */}
      {filteredDevices.length > 0 ? (
          <div role="feed" aria-label="Connected devices">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                latestTelemetry={telemetryMap[device.id]}
                onInspect={onInspectDevice}
                onRevoke={onRevokeDevice}
                busy={busy}
              />
            ))}
          </div>
        ) : devices.length === 0 ? (
          /* Empty State */
          <div className="empty-state-box onboarding-empty-state">
            <div className="empty-state-icon-box" aria-hidden="true">
              <ShieldPlus size={32} weight="regular" />
            </div>
            <h2
              style={{
                fontSize: '19px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              Let’s connect your first phone
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                maxWidth: '420px',
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}
            >
              Keep both phones nearby. The person who owns the other phone must approve setup on that phone.
            </p>
            <ol className="pairing-steps" aria-label="Setup steps">
              <li><span>1</span><div><strong>Install XennGuard</strong><small>Open it on the phone you want to connect.</small></div></li>
              <li><span>2</span><div><strong>Ask the owner to approve</strong><small>They review and approve the connection on their phone.</small></div></li>
              <li><span>3</span><div><strong>Connect the phones</strong><small>Use the one-time setup code while both phones are nearby.</small></div></li>
            </ol>
            {!serverConnected && (
              <p className="pairing-unavailable" role="status">
                Setup is temporarily unavailable because XennGuard cannot reach its server. Try again when the connection is restored.
              </p>
            )}
            <Button
              variant="primary"
              icon={<Plus size={16} weight="bold" />}
              onClick={onPairDevice}
              disabled={busy || !serverConnected}
            >
              {busy ? 'Preparing setup…' : 'Start setup'}
            </Button>
          </div>
        ) : (
          /* No search results */
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              background: '#FFFFFF',
              border: '1px solid var(--color-surface-card-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600 }}>
              No devices match your search &ldquo;{searchQuery}&rdquo;.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
    </div>
  )
}
