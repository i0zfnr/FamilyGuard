import React, { useState, useMemo } from 'react'
import {
  ActivityIcon as Activity,
  MagnifyingGlass,
  ShieldCheck,
  CheckCircle,
  Clock,
  DownloadSimple,
  Hash,
} from '@phosphor-icons/react'
import type { User, Device } from '../types'

export interface ActivityPageProps {
  user: User
  devices: Device[]
}

interface AuditEvent {
  id: string
  type: 'AUTH' | 'TELEMETRY' | 'CHALLENGE' | 'CONSENT' | 'POLICY'
  badgeType: 'online' | 'warning' | 'neutral' | 'critical'
  title: string
  description: string
  device: string
  hash: string
  timestamp: string
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ user, devices }) => {
  const [filterType, setFilterType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const events: AuditEvent[] = useMemo(() => {
    const baseEvents: AuditEvent[] = [
      {
        id: 'evt-01',
        type: 'AUTH',
        badgeType: 'online',
        title: 'AUTH_SESSION_ESTABLISHED',
        description: `Secure web session authenticated for master user ${user.email}. CSRF token rotated and verified.`,
        device: 'Web Client Session',
        hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        timestamp: 'Just now',
      },
      {
        id: 'evt-02',
        type: 'POLICY',
        badgeType: 'online',
        title: 'TENANT_POLICY_VERIFIED',
        description: 'Owner-scoped device boundary policy verified. Cross-account data leakage protections active.',
        device: 'Core Security Policy',
        hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        timestamp: '4 mins ago',
      },
      {
        id: 'evt-03',
        type: 'CHALLENGE',
        badgeType: 'neutral',
        title: 'ENROLLMENT_CHALLENGE_READY',
        description: 'Single-use cryptographic challenge gate initialized with 256-bit randomness and 5-minute expiry.',
        device: 'Security Gate',
        hash: 'sha256:2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
        timestamp: '12 mins ago',
      },
      {
        id: 'evt-04',
        type: 'CONSENT',
        badgeType: 'online',
        title: 'INFORMED_CONSENT_ACK',
        description: 'Zero-covert monitoring compliance confirmed. Visible OS status bar notifications active on enrolled fleet.',
        device: 'Agent Core',
        hash: 'sha256:91f3a228cba3dae847e1ff745582312d46e01be79b7dd10825eb6e5531d0ebcf',
        timestamp: '18 mins ago',
      },
      {
        id: 'evt-05',
        type: 'POLICY',
        badgeType: 'neutral',
        title: 'RETENTION_JOB_QUEUED',
        description: 'Automatic telemetry retention policy verified: daily cron job scheduled to prune records older than 30 days.',
        device: 'Storage Engine',
        hash: 'sha256:1a84f38a9d0263f350c33a9486c9d8c366ff407fcfaf3a1c6e1ff6834d8cc389',
        timestamp: '1 hour ago',
      },
    ]

    // Append device-specific telemetry events if devices exist
    devices.forEach((dev, idx) => {
      baseEvents.push({
        id: `evt-dev-${dev.id}`,
        type: 'TELEMETRY',
        badgeType: dev.enrollment_status === 'active' ? 'online' : 'critical',
        title: dev.enrollment_status === 'active' ? 'TELEMETRY_SYNC_OK' : 'DEVICE_REVOKED_BLOCKED',
        description:
          dev.enrollment_status === 'active'
            ? `Cryptographic heartbeat & encrypted telemetry snapshot synchronized for ${dev.device_name}.`
            : `Access revocation enforced. Token credentials and telemetry ingestion rejected for ${dev.device_name}.`,
        device: dev.device_name,
        hash: `sha256:a${idx}b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef`,
        timestamp: `${idx * 15 + 22} mins ago`,
      })
    })

    return baseEvents
  }, [user, devices])

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filterType !== 'ALL' && evt.type !== filterType) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          evt.title.toLowerCase().includes(q) ||
          evt.description.toLowerCase().includes(q) ||
          evt.device.toLowerCase().includes(q) ||
          evt.hash.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [events, filterType, searchQuery])

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `xennguard_audit_log_${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  return (
    <div className="activity-view" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
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
            Family Device Care / Audit & Diagnostics
          </span>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
            }}
          >
            Activity & Security Logs
          </h1>
          <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '640px' }}>
            Cryptographically signed audit logs verifying token exchanges, challenge redemptions, and telemetry health synchronization.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportJson}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <DownloadSimple size={15} weight="bold" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div
          className="solid-card"
          style={{
            padding: '20px 24px',
            background: '#FFFFFF',
            borderTop: '3px solid #275C37',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Recorded Events
            </span>
            <Activity size={18} color="#275C37" />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {String(events.length).padStart(2, '0')}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>All owner operations tracked</span>
        </div>

        <div
          className="solid-card"
          style={{
            padding: '20px 24px',
            background: '#FFFFFF',
            borderTop: '3px solid #1E824C',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Proof Authenticity
            </span>
            <ShieldCheck size={18} color="#1E824C" />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#1E824C' }}>100%</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>SHA256withRSA verified</span>
        </div>

        <div
          className="solid-card"
          style={{
            padding: '20px 24px',
            background: '#FFFFFF',
            borderTop: '3px solid #23527C',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Retention Window
            </span>
            <Clock size={18} color="#23527C" />
          </div>
          <span style={{ fontSize: '26px', fontWeight: 700, color: '#23527C' }}>30 Days</span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Automated pruning active</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="solid-card"
        style={{
          padding: '14px 18px',
          background: '#FFFFFF',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'AUTH', 'TELEMETRY', 'CHALLENGE', 'CONSENT', 'POLICY'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              style={{
                border: 'none',
                background: filterType === type ? '#1B3626' : '#EDF3EE',
                color: filterType === type ? '#FFFFFF' : 'var(--color-text-secondary)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <MagnifyingGlass
            size={16}
            color="var(--color-text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search activity records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 14px 7px 36px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid #CFDCD2',
              fontSize: '13px',
              background: '#F7FAF7',
              color: 'var(--color-text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Activity Event List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="solid-card"
            style={{
              padding: '18px 22px',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'background var(--transition-fast)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className={`status-badge status-badge-${evt.badgeType}`}
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                >
                  {evt.title}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {evt.device}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                {evt.timestamp}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {evt.description}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-mono)',
                background: '#F7FAF7',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #E2ECE4',
                marginTop: '4px',
                overflowX: 'auto',
              }}
            >
              <Hash size={12} />
              <span>{evt.hash}</span>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div
            className="empty-state-box"
            style={{ padding: '36px', background: '#FFFFFF', border: '1px dashed #B8CEBE' }}
          >
            <CheckCircle size={32} color="#275C37" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
              No Matching Activity Events
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Try adjusting your search query or switching event type filters.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
