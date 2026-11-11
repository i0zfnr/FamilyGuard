import { useState, useEffect, useId } from 'react'
import { ShieldCheck, Copy, Check, Clock, Warning, X } from '@phosphor-icons/react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from './Button'
import type { EnrollmentChallenge } from '../types'
import { getSupabasePublishableKey } from '../services/supabase'

export interface EnrollmentModalProps {
  challenge: EnrollmentChallenge | null
  isOpen: boolean
  onClose: () => void
  onCancelChallenge: (id: string) => Promise<void>
  busy?: boolean
}

export function EnrollmentModal({
  challenge,
  isOpen,
  onClose,
  onCancelChallenge,
  busy = false,
}: EnrollmentModalProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(300) // 5 minutes in seconds
  const titleId = useId()

  useEffect(() => {
    if (!challenge || !isOpen) return

    const expiresAt = new Date(challenge.expires_at).getTime()
    const updateCountdown = () => {
      const remainingMs = expiresAt - Date.now()
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000))
      setTimeLeft(remainingSec)
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [challenge, isOpen])

  if (!isOpen || !challenge) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  const isExpiringSoon = timeLeft < 60
  const isExpired = timeLeft === 0

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pairingPayload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleCancel = async () => {
    await onCancelChallenge(challenge.id)
    onClose()
  }

  const pairingPayload = JSON.stringify({
    server: new URL(import.meta.env.VITE_SUPABASE_URL).origin,
    api_key: getSupabasePublishableKey(),
    challenge_id: challenge.id,
    challenge_token: challenge.token,
  })

  if (!challenge.enrollment_available) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="liquid-glass-modal enrollment-modal-content">
          <div className="enrollment-modal-heading">
            <div className="auth-card-icon-box" aria-hidden="true"><Warning size={22} /></div>
            <div><h2 id={titleId}>Setup is unavailable</h2><p>Device enrollment is currently turned off on the server.</p></div>
          </div>
          <p className="enrollment-guidance">No phone was connected. Close this window and try again after enrollment is enabled.</p>
          <div className="enrollment-actions">
            <Button variant="secondary" onClick={handleCancel} disabled={busy}>Close and discard code</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="liquid-glass-modal"
        role="document"
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-surface-card-border)',
          padding: '32px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
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
              <ShieldCheck size={24} weight="regular" />
            </div>
            <div>
              <h3 id={titleId} style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Connect a phone
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                The phone owner must approve this connection on their device.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={16} weight="bold" />}
            onClick={onClose}
            aria-label="Close modal"
          />
        </div>

        {/* QR Code Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#F7FAF7',
            border: '1px solid #DCE6DE',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '180px',
              height: '180px',
              padding: '12px',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #CFDCD2',
              boxShadow: '0 2px 8px rgba(20, 42, 28, 0.05)',
              marginBottom: '16px',
            }}
          >
            <QRCodeSVG
              value={pairingPayload}
              size={156}
              level="Q"
              title="One-time XennGuard phone setup code"
              className="pairing-qr"
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              background: isExpiringSoon ? '#FEF7EC' : '#EBF5EE',
              color: isExpiringSoon ? '#964B09' : '#1A6E40',
              border: `1px solid ${isExpiringSoon ? '#F9DEB7' : '#C6E6D0'}`,
            }}
          >
            {isExpiringSoon ? <Warning size={14} weight="bold" aria-hidden="true" /> : <Clock size={14} weight="regular" aria-hidden="true" />}
            <span>
              {isExpired ? 'Challenge Expired' : `Expires in ${formattedTime}`}
            </span>
          </div>
        </div>

        {/* Challenge Secret */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
            One-time setup code
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: '#F0F5F1',
              border: '1px solid #CFDCD2',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
            }}
          >
            <textarea
              aria-label="One-time setup code"
              readOnly
              value={pairingPayload}
              rows={2}
              onFocus={(event) => event.currentTarget.select()}
              style={{ flex: 1, minWidth: 0, resize: 'vertical', border: 0, background: 'transparent', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px', lineHeight: 1.4 }}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} weight="bold" color="#1A6E40" /> : <Copy size={14} weight="regular" />}
              onClick={handleCopy}
              title="Copy one-time setup code"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        <p className="enrollment-guidance">On the other phone, open XennGuard and paste this code into setup. Its owner reviews and approves the connection there.</p>

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <Button
            variant="danger"
            size="md"
            onClick={handleCancel}
            disabled={busy}
          >
            Cancel setup
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
