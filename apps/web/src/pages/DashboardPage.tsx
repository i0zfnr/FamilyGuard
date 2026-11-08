import { useState, useMemo } from 'react'
import {
  DeviceMobileCamera,
  MagnifyingGlass,
  Plus,
  ShieldPlus,
  Sliders,
  ActivityIcon as Activity,
  LockKey,
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
  busy?: boolean
}

export function DashboardPage({
  user,
  devices,
  telemetryMap = {},
  onInspectDevice,
  onRevokeDevice,
  onPairDevice,
  busy = false,
}: DashboardPageProps) {
  const [platformFilter, setPlatformFilter] = useState<'all' | 'android' | 'windows'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSidebarNav, setActiveSidebarNav] = useState<'devices' | 'activity' | 'security' | 'settings'>('devices')
  const [now] = useState(() => Date.now())

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
      if (platformFilter !== 'all' && device.platform !== platformFilter) return false
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
  }, [devices, platformFilter, searchQuery])

  return (
    <div
      className="dashboard-container"
      style={{
        display: 'grid',
        gridTemplateColumns: '240px minmax(0, 1fr)',
        gap: '32px',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '108px 24px 48px',
        alignItems: 'start',
      }}
    >
      {/* Left Workspace Sidebar */}
      <aside
        className="workspace-sidebar"
        style={{
          background: '#FFFFFF',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-label="Workspace Navigation"
      >
        <div
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '4px 12px 10px',
          }}
        >
          WORKSPACE
        </div>

        <button
          type="button"
          onClick={() => setActiveSidebarNav('devices')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            background: activeSidebarNav === 'devices' ? '#1B3626' : 'transparent',
            color: activeSidebarNav === 'devices' ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          aria-current={activeSidebarNav === 'devices' ? 'page' : undefined}
        >
          <DeviceMobileCamera size={18} weight="regular" aria-hidden="true" />
          <span>Devices</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSidebarNav('activity')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            background: activeSidebarNav === 'activity' ? '#1B3626' : 'transparent',
            color: activeSidebarNav === 'activity' ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          aria-current={activeSidebarNav === 'activity' ? 'page' : undefined}
        >
          <Activity size={18} weight="regular" aria-hidden="true" />
          <span>Activity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSidebarNav('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            background: activeSidebarNav === 'security' ? '#1B3626' : 'transparent',
            color: activeSidebarNav === 'security' ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          aria-current={activeSidebarNav === 'security' ? 'page' : undefined}
        >
          <LockKey size={18} weight="regular" aria-hidden="true" />
          <span>Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSidebarNav('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            background: activeSidebarNav === 'settings' ? '#1B3626' : 'transparent',
            color: activeSidebarNav === 'settings' ? '#FFFFFF' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}
          aria-current={activeSidebarNav === 'settings' ? 'page' : undefined}
        >
          <Sliders size={18} weight="regular" aria-hidden="true" />
          <span>Settings</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ minWidth: 0 }}>
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

          <Button
            variant="primary"
            icon={<Plus size={16} weight="bold" />}
            onClick={onPairDevice}
            disabled={busy}
          >
            Pair New Device
          </Button>
        </div>

        {/* Metric Platter */}
        <StatPlatter
          total={metrics.total}
          online={metrics.online}
          alerts={metrics.alerts}
        />

        {/* Filter & Search Bar */}
        <div
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
              gap: '6px',
              background: '#EDF3EE',
              padding: '4px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid #DCE6DE',
            }}
            aria-label="Filter devices by platform"
          >
            <button
              type="button"
              onClick={() => setPlatformFilter('all')}
              style={{
                border: 'none',
                background: platformFilter === 'all' ? '#1B3626' : 'transparent',
                color: platformFilter === 'all' ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              All Devices
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('android')}
              style={{
                border: 'none',
                background: platformFilter === 'android' ? '#1B3626' : 'transparent',
                color: platformFilter === 'android' ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => setPlatformFilter('windows')}
              style={{
                border: 'none',
                background: platformFilter === 'windows' ? '#1B3626' : 'transparent',
                color: platformFilter === 'windows' ? '#FFFFFF' : 'var(--color-text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              Windows
            </button>
          </div>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            <MagnifyingGlass
              size={16}
              weight="bold"
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices by name, platform, or ID..."
              style={{
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                fontSize: '13px',
                borderRadius: 'var(--radius-pill)',
                background: '#FFFFFF',
              }}
              aria-label="Search devices"
            />
          </div>
        </div>

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
          <div className="empty-state-box">
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
              No protected devices enrolled
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
              Connect an Android phone or Windows PC with mutual owner consent.
              All telemetry is cryptographically authenticated and encrypted.
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} weight="bold" />}
              onClick={onPairDevice}
              disabled={busy}
            >
              Pair first device
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
                setPlatformFilter('all')
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
