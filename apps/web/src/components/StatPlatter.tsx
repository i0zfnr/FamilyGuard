import { Devices, WifiHigh, ShieldWarning } from '@phosphor-icons/react'

export interface StatPlatterProps {
  total: number
  online: number
  alerts: number
  className?: string
}

export function StatPlatter({ total, online, alerts, className = '' }: StatPlatterProps) {
  const formattedTotal = String(total).padStart(2, '0')
  const formattedOnline = String(online).padStart(2, '0')
  const formattedAlerts = String(alerts).padStart(2, '0')

  return (
    <div
      className={`stat-density-grid ${className}`.trim()}
      role="region"
      aria-label="Device statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(130px, 1fr))',
        gap: '14px',
        width: '100%',
        maxWidth: '560px',
        marginBottom: '24px',
      }}
    >
      {/* Total Metric Card */}
      <div
        className="stat-box"
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: 'var(--shadow-card)',
          borderTop: '3px solid #275C37',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Total:
          </span>
          <Devices size={18} weight="regular" color="#275C37" aria-hidden="true" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <strong
            className="stat-value tabular-nums"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1,
            }}
          >
            {formattedTotal}
          </strong>
          {/* Accessible raw number for unit test assertion */}
          <span className="sr-only">{total}</span>
        </div>
      </div>

      {/* Online Metric Card */}
      <div
        className="stat-box"
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: 'var(--shadow-card)',
          borderTop: '3px solid #1E824C',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Online:
          </span>
          <WifiHigh size={18} weight="bold" color="#1E824C" aria-hidden="true" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <strong
            className="stat-value tabular-nums"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#1E824C',
              lineHeight: 1,
            }}
          >
            {formattedOnline}
          </strong>
          {/* Accessible raw number for unit test assertion */}
          <span className="sr-only">{online}</span>
        </div>
      </div>

      {/* Alerts Metric Card */}
      <div
        className="stat-box"
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: 'var(--shadow-card)',
          borderTop: '3px solid #A85A12',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Alerts:
          </span>
          <ShieldWarning size={18} weight="bold" color="#A85A12" aria-hidden="true" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <strong
            className="stat-value tabular-nums"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#A85A12',
              lineHeight: 1,
            }}
          >
            {formattedAlerts}
          </strong>
          {/* Accessible raw number for unit test assertion */}
          <span className="sr-only">{alerts}</span>
        </div>
      </div>
    </div>
  )
}
