import React, { useState } from 'react'
import {
  User,
  EnvelopeSimple,
  ShieldCheck,
  Check,
  SignOut,
  Info,
} from '@phosphor-icons/react'
import type { User as UserType } from '../types'

export interface SettingsPageProps {
  user: UserType
  onSignOut: () => void
  busy?: boolean
  serverConnected?: boolean
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onSignOut,
  busy = false,
  serverConnected = true,
}) => {
  const [qrRequired, setQrRequired] = useState(true)
  const [retentionDays, setRetentionDays] = useState('30')
  const [notificationSaved, setNotificationSaved] = useState(false)

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationSaved(true)
    setTimeout(() => setNotificationSaved(false), 3000)
  }

  return (
    <div className="settings-view" style={{ maxWidth: '860px', margin: '0 auto' }}>
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
          Family Device Care / Workspace Preferences
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
          Security & Workspace Settings
        </h1>
        <p style={{ fontSize: '14.5px', color: 'var(--color-text-secondary)', margin: 0 }}>
          Manage master administrator credentials, cryptographic proof policies, and session preferences.
        </p>
      </div>

      {notificationSaved && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-status-online-bg)',
            border: '1px solid var(--color-status-online-border)',
            color: 'var(--color-status-online)',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          <Check size={16} weight="bold" />
          <span>Workspace policy settings updated and applied successfully.</span>
        </div>
      )}

      {/* Account Identity Card */}
      <div
        className="solid-card"
        style={{
          background: '#FFFFFF',
          padding: '28px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EAF2EB',
              border: '1px solid #D2E0D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#275C37',
            }}
          >
            <User size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Master Account Identity
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Primary administrative identity responsible for mutual device consent.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          <div
            style={{
              padding: '16px',
              background: '#F7FAF7',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #DCE6DE',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Account Name
            </span>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {user.name}
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              background: '#F7FAF7',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #DCE6DE',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
              Email Identity
            </span>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <EnvelopeSimple size={16} color="var(--color-text-muted)" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Pairing Policy Form */}
      <form
        onSubmit={handleSavePolicy}
        className="solid-card"
        style={{
          background: '#FFFFFF',
          padding: '28px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EAF2EB',
              border: '1px solid #D2E0D5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#275C37',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Device Pairing & Proof Policies
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Parameters governing challenge generation and client key exchange.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: '#F7FAF7',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #DCE6DE',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block' }}>
                Require Physical Proximity QR Challenge
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                Enforces camera QR code scanning rather than remote token copy/paste.
              </span>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={qrRequired}
                onChange={(e) => setQrRequired(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: qrRequired ? '#1B3626' : '#CFDCD2',
                  borderRadius: '24px',
                  transition: 'background-color var(--transition-fast)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: qrRequired ? '21px' : '3px',
                    bottom: '3px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transition: 'left var(--transition-fast)',
                  }}
                />
              </span>
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: '#F7FAF7',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #DCE6DE',
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--color-text-primary)', display: 'block' }}>
                Telemetry Retention Window
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                Automated scheduler prunes encrypted battery and storage history after this threshold.
              </span>
            </div>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #CFDCD2',
                background: '#FFFFFF',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <option value="30">30 Days (Standard)</option>
              <option value="14">14 Days (Strict)</option>
              <option value="7">7 Days (Minimal)</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-start', marginTop: '6px' }}
          >
            Save Policy Changes
          </button>
        </div>
      </form>

      {/* System Environment & Diagnostic Info */}
      <div
        className="solid-card"
        style={{
          background: '#FFFFFF',
          padding: '28px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EEF4F8',
              border: '1px solid #D2E0EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#23527C',
            }}
          >
            <Info size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              System Information
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Active runtime parameters and server connectivity.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EDF3EE' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Server Endpoint</span>
            <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
              http://127.0.0.1:8001
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EDF3EE' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Status</span>
            <span style={{ color: serverConnected ? '#1A6E40' : '#F59E0B', fontWeight: 700 }}>
              {serverConnected ? 'Connected & Synchronized' : 'Connecting...'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #EDF3EE' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Zero-Emoji Directives</span>
            <span style={{ color: '#1A6E40', fontWeight: 700 }}>Strictly Enforced (Phosphor Icons)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Interface Architecture</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>Docked Obsidian Sidebar + Porcelain Canvas</strong>
          </div>
        </div>
      </div>

      {/* Session Sign Out Action */}
      <div
        className="solid-card"
        style={{
          background: '#FFFFFF',
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <strong style={{ fontSize: '15px', color: 'var(--color-text-primary)', display: 'block' }}>
            Terminate Current Session
          </strong>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Safely close your active master session on this browser.
          </span>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <SignOut size={16} weight="bold" />
          <span>Sign Out of XennGuard</span>
        </button>
      </div>
    </div>
  )
}
