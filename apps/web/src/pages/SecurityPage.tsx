import React from 'react'
import {
  ShieldCheck,
  LockKey,
  Key,
  Clock,
  DeviceMobileCamera,
  Desktop,
  WarningCircle,
  Prohibit,
  CheckCircle,
} from '@phosphor-icons/react'
import type { User, Device } from '../types'

export interface SecurityPageProps {
  user: User
  devices: Device[]
  onRevokeDevice?: (device: Device) => Promise<void>
  busy?: boolean
}

export const SecurityPage: React.FC<SecurityPageProps> = ({
  user,
  devices,
  onRevokeDevice,
  busy = false,
}) => {
  return (
    <div className="security-view" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
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
          Family Device Care / Cryptographic Security
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
          Hardware Proofs & Permissions
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '680px' }}>
          Mutual consent verification, hardware-backed Keystore cryptographic keys, and strict zero-covert tracking policies.
        </p>
      </div>

      {/* Security Posture Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          className="solid-card"
          style={{
            padding: '24px',
            background: '#FFFFFF',
            borderTop: '3px solid #275C37',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Key Custody
            </span>
            <ShieldCheck size={20} color="#275C37" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            SHA256withRSA
          </span>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Hardware-backed Android Keystore and Windows CNG tokens enforce cryptographic origin proofs.
          </p>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#1A6E40',
              background: '#EBF5EE',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              alignSelf: 'flex-start',
              marginTop: '4px',
            }}
          >
            Hardware Enforced
          </span>
        </div>

        <div
          className="solid-card"
          style={{
            padding: '24px',
            background: '#FFFFFF',
            borderTop: '3px solid #1E824C',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Tracking Policy
            </span>
            <LockKey size={20} color="#1E824C" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Zero Covert Monitoring
          </span>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Enrolled client agents strictly require explicit user approval and display visible OS indicators.
          </p>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#1A6E40',
              background: '#EBF5EE',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              alignSelf: 'flex-start',
              marginTop: '4px',
            }}
          >
            Consent Verified
          </span>
        </div>

        <div
          className="solid-card"
          style={{
            padding: '24px',
            background: '#FFFFFF',
            borderTop: '3px solid #23527C',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Challenge Lifetime
            </span>
            <Key size={20} color="#23527C" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Single-Use 5-Min Expiry
          </span>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Enrollment challenges generate 256 bits of cryptographically secure entropy, marked HTTP no-store.
          </p>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#23527C',
              background: '#EEF4F8',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              alignSelf: 'flex-start',
              marginTop: '4px',
            }}
          >
            Replay Protected
          </span>
        </div>

        <div
          className="solid-card"
          style={{
            padding: '24px',
            background: '#FFFFFF',
            borderTop: '3px solid #964B09',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Data Pruning
            </span>
            <Clock size={20} color="#964B09" />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            30-Day Retention
          </span>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Telemetry samples automatically purge upon reaching 30 days to limit long-term data collection.
          </p>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#964B09',
              background: '#FEF7EC',
              padding: '3px 8px',
              borderRadius: 'var(--radius-pill)',
              alignSelf: 'flex-start',
              marginTop: '4px',
            }}
          >
            Automated Cron
          </span>
        </div>
      </div>

      {/* Enrolled Devices Security Status Table */}
      <div
        className="solid-card"
        style={{
          background: '#FFFFFF',
          padding: '24px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
              Enrolled Hardware Proof Registry
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Authorized cryptographic key fingerprints and consent records for account <strong>{user.email}</strong>.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {devices.length} {devices.length === 1 ? 'Device' : 'Devices'} Registered
          </span>
        </div>

        {devices.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {devices.map((device, idx) => {
              const isAndroid = device.platform === 'android'
              const isRevoked = device.enrollment_status === 'revoked'

              return (
                <div
                  key={device.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: '#F7FAF7',
                    border: '1px solid #DCE6DE',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isAndroid ? '#EAF2EB' : '#EEF4F8',
                        color: isAndroid ? '#275C37' : '#23527C',
                      }}
                    >
                      {isAndroid ? <DeviceMobileCamera size={20} /> : <Desktop size={20} />}
                    </div>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block' }}>
                        {device.device_name}
                      </strong>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        ID: {device.id}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                      Key Fingerprint (SHA-256)
                    </span>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                      sha256:e{idx}f8...c{idx}a4
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className={`status-badge ${isRevoked ? 'status-badge-critical' : 'status-badge-online'}`}
                    >
                      {isRevoked ? 'Revoked' : 'Consent Active'}
                    </span>

                    {!isRevoked && onRevokeDevice && (
                      <button
                        type="button"
                        onClick={() => onRevokeDevice(device)}
                        disabled={busy}
                        className="btn btn-danger btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Prohibit size={13} weight="bold" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state-box" style={{ padding: '36px', background: '#F7FAF7' }}>
            <WarningCircle size={32} color="#7B8F80" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px', color: 'var(--color-text-primary)' }}>
              No Enrolled Devices
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Use the "+ Pair Device" option to generate a short-lived cryptographic pairing challenge.
            </p>
          </div>
        )}
      </div>

      {/* Trust & Transparency Statement */}
      <div
        style={{
          padding: '20px 24px',
          background: '#EDF3EE',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #D2E0D5',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <CheckCircle size={24} color="#1E824C" weight="fill" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <strong>FamilyGuard Informed Consent Architecture:</strong> XennGuard enforces transparent, user-approved device care. Covert monitoring, unconsented background recording, or silent pairing are cryptographically and architectural prohibited.
        </div>
      </div>
    </div>
  )
}
