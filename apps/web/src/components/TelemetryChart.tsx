import { useId } from 'react'
import {
  BatteryCharging,
  HardDrive,
  WifiHigh,
  Broadcast,
  PlugsConnected,
  WifiSlash,
  Lightning,
} from '@phosphor-icons/react'
import type { Telemetry } from '../types'

export interface TelemetryChartProps {
  data: Telemetry[]
  deviceName?: string
}

export function TelemetryChart({ data, deviceName }: TelemetryChartProps) {
  const gradientId = useId()

  // Sort chronological for time series (oldest to newest)
  const sorted = [...data].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  )

  const latest = sorted[sorted.length - 1]

  // Battery history spline computation
  const batteryPoints = sorted.filter((d) => d.battery_percentage != null)

  const svgWidth = 640
  const svgHeight = 220
  const paddingX = 50
  const paddingY = 30
  const chartWidth = svgWidth - paddingX * 2
  const chartHeight = svgHeight - paddingY * 2

  let splinePath = ''
  let areaPath = ''
  const plottedPoints: Array<{ x: number; y: number; val: number; charging: boolean; time: string }> = []

  if (batteryPoints.length > 0) {
    batteryPoints.forEach((point, index) => {
      const x =
        batteryPoints.length === 1
          ? paddingX + chartWidth / 2
          : paddingX + (index / (batteryPoints.length - 1)) * chartWidth
      const y = paddingY + chartHeight - ((point.battery_percentage ?? 0) / 100) * chartHeight

      plottedPoints.push({
        x,
        y,
        val: point.battery_percentage ?? 0,
        charging: Boolean(point.charging),
        time: new Date(point.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    })

    if (plottedPoints.length === 1) {
      splinePath = `M ${paddingX} ${plottedPoints[0].y} L ${paddingX + chartWidth} ${plottedPoints[0].y}`
      areaPath = `M ${paddingX} ${plottedPoints[0].y} L ${paddingX + chartWidth} ${plottedPoints[0].y} L ${paddingX + chartWidth} ${paddingY + chartHeight} L ${paddingX} ${paddingY + chartHeight} Z`
    } else {
      let d = `M ${plottedPoints[0].x} ${plottedPoints[0].y}`
      for (let i = 0; i < plottedPoints.length - 1; i++) {
        const p0 = plottedPoints[i === 0 ? i : i - 1]
        const p1 = plottedPoints[i]
        const p2 = plottedPoints[i + 1]
        const p3 = plottedPoints[i + 2] ? plottedPoints[i + 2] : p2

        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6

        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
      }
      splinePath = d
      areaPath = `${d} L ${plottedPoints[plottedPoints.length - 1].x} ${paddingY + chartHeight} L ${plottedPoints[0].x} ${paddingY + chartHeight} Z`
    }
  }

  // Storage partition calculations
  const storageTotal = latest?.storage_total
  const storageAvailable = latest?.storage_available
  let usedPercent = 0
  let usedGiB = '0'
  let totalGiB = '0'
  let freeGiB = '0'

  if (storageTotal != null && storageAvailable != null && storageTotal > 0) {
    const usedBytes = Math.max(0, storageTotal - storageAvailable)
    usedPercent = Math.min(100, Math.round((usedBytes / storageTotal) * 100))
    usedGiB = (usedBytes / (1024 * 1024 * 1024)).toFixed(1)
    totalGiB = (storageTotal / (1024 * 1024 * 1024)).toFixed(1)
    freeGiB = (storageAvailable / (1024 * 1024 * 1024)).toFixed(1)
  }

  // Network icon helper
  const getNetworkIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'wifi':
        return <WifiHigh size={15} weight="bold" color="#275C37" aria-hidden="true" />
      case 'cellular':
        return <Broadcast size={15} weight="bold" color="#1B3626" aria-hidden="true" />
      case 'ethernet':
        return <PlugsConnected size={15} weight="bold" color="#1A6E40" aria-hidden="true" />
      default:
        return <WifiSlash size={15} weight="regular" color="#7B8F80" aria-hidden="true" />
    }
  }

  return (
    <div className="telemetry-visualizer-suite" aria-label="Telemetry history visualizations" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Battery Spline Trend Curve */}
      <section
        className="solid-card"
        style={{
          padding: '24px 28px',
          background: '#FFFFFF',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-labelledby="battery-chart-heading"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: '#EAF2EB',
                border: '1px solid #D3E3D6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#275C37',
              }}
              aria-hidden="true"
            >
              <Lightning size={20} weight="fill" />
            </div>
            <div>
              <h4 id="battery-chart-heading" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Battery Discharge & Charge Dynamics
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                {deviceName ? `Telemetry curve for ${deviceName}` : 'Historical voltage and state trajectory'}
              </p>
            </div>
          </div>
          {latest?.battery_percentage != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {latest.charging && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#1A6E40',
                    background: '#EBF5EE',
                    border: '1px solid #C6E6D0',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  <BatteryCharging size={14} weight="bold" aria-hidden="true" />
                  Charging
                </span>
              )}
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {latest.battery_percentage}%
              </span>
            </div>
          )}
        </div>

        {batteryPoints.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No battery telemetry reports recorded yet.
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              aria-label="Battery percentage spline chart"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#275C37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#275C37" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[100, 75, 50, 25, 0].map((level) => {
                const y = paddingY + chartHeight - (level / 100) * chartHeight
                return (
                  <g key={level}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={paddingX + chartWidth}
                      y2={y}
                      stroke="#E2ECE4"
                      strokeDasharray={level === 0 ? 'none' : '4 4'}
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="var(--color-text-muted)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      textAnchor="end"
                    >
                      {level}%
                    </text>
                  </g>
                )
              })}

              {/* Gradient Area Fill */}
              {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

              {/* Battery Trend Line Spline */}
              {splinePath && (
                <path
                  d={splinePath}
                  fill="none"
                  stroke="#1B3626"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data Point Dots */}
              {plottedPoints.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.charging ? 5 : 3.5}
                    fill={pt.charging ? '#1A6E40' : '#1B3626'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {pt.charging && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="8"
                      fill="none"
                      stroke="#1A6E40"
                      strokeOpacity="0.4"
                      strokeWidth="1.5"
                    />
                  )}
                  {(i === 0 || i === plottedPoints.length - 1 || (plottedPoints.length > 4 && i % 3 === 0)) && (
                    <text
                      x={pt.x}
                      y={svgHeight - 8}
                      fill="var(--color-text-muted)"
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      textAnchor="middle"
                    >
                      {pt.time}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        )}
      </section>

      {/* Storage Partition Bar */}
      <section
        className="solid-card"
        style={{
          padding: '24px 28px',
          background: '#FFFFFF',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-labelledby="storage-chart-heading"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: '#EEF4F8',
                border: '1px solid #D2E0EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#23527C',
              }}
              aria-hidden="true"
            >
              <HardDrive size={20} weight="regular" />
            </div>
            <div>
              <h4 id="storage-chart-heading" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Hardware Storage Allocation
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Partition capacity distribution
              </p>
            </div>
          </div>
          {storageTotal != null && (
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {usedPercent}% Used
            </span>
          )}
        </div>

        {storageTotal == null ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            Storage metrics not reported by this client.
          </div>
        ) : (
          <div>
            <div
              role="progressbar"
              aria-valuenow={usedPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Storage usage"
              style={{
                width: '100%',
                height: '10px',
                background: '#EDF3EE',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                margin: '12px 0',
              }}
            >
              <div
                style={{
                  width: `${usedPercent}%`,
                  height: '100%',
                  background: '#1B3626',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              <div>
                <strong style={{ color: '#1B3626' }}>{usedGiB} GiB</strong> used
              </div>
              <div>
                <strong style={{ color: 'var(--color-text-primary)' }}>{freeGiB} GiB</strong> free of{' '}
                <strong style={{ color: 'var(--color-text-primary)' }}>{totalGiB} GiB</strong>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Network Connectivity History */}
      <section
        className="solid-card"
        style={{
          padding: '24px 28px',
          background: '#FFFFFF',
          border: '1px solid var(--color-surface-card-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
        aria-labelledby="network-history-heading"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: '#EAF2EB',
              border: '1px solid #D3E3D6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#275C37',
            }}
            aria-hidden="true"
          >
            <WifiHigh size={20} weight="bold" />
          </div>
          <div>
            <h4 id="network-history-heading" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Network Connectivity Log
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
              Recent transport interfaces used for telemetry transmission
            </p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No network events recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sorted.slice(-5).reverse().map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: '#F7FAF7',
                  border: '1px solid #DCE6DE',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {getNetworkIcon(item.network_type)}
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
                    {item.network_type ?? 'Unknown Interface'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(item.recorded_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
