import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'

export type StatusType = 'online' | 'warning' | 'critical' | 'neutral'

export interface StatusBadgeProps {
  status: StatusType
  label?: string
  pulse?: boolean
  showIcon?: boolean
}

export function StatusBadge({
  status,
  label,
  pulse = true,
  showIcon = true,
}: StatusBadgeProps) {
  const statusConfig = {
    online: {
      defaultLabel: 'Online',
      badgeClass: 'status-badge-online',
      icon: CheckCircle,
    },
    warning: {
      defaultLabel: 'Warning',
      badgeClass: 'status-badge-warning',
      icon: AlertTriangle,
    },
    critical: {
      defaultLabel: 'Revoked',
      badgeClass: 'status-badge-critical',
      icon: XCircle,
    },
    neutral: {
      defaultLabel: 'Idle',
      badgeClass: 'status-badge-neutral',
      icon: Clock,
    },
  }[status]

  const IconComponent = statusConfig.icon
  const displayLabel = label || statusConfig.defaultLabel

  return (
    <span className={`status-badge ${statusConfig.badgeClass}`}>
      <span
        className={`status-dot ${pulse && status === 'online' ? 'pulse' : ''}`}
        aria-hidden="true"
      />
      {showIcon && <IconComponent size={12} aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  )
}
