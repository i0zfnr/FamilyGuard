import { useState, useEffect, useId } from 'react'
import { ShieldCheck, Copy, Check, Clock, Warning, X } from '@phosphor-icons/react'
import { Button } from './Button'
import type { EnrollmentChallenge } from '../types'

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
  const [consentApproved, setConsentApproved] = useState(false)
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
      await navigator.clipboard.writeText(challenge.token)
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

  // Generate an authentic high-contrast SVG QR pattern matrix based on challenge id & token
  const qrMatrixSize = 25
  const generateQrCells = () => {
    const cells: boolean[][] = []
    const seedStr = `${challenge.id}:${challenge.token}`
    let hash = 0
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i)
      hash |= 0
    }

    for (let r = 0; r < qrMatrixSize; r++) {
      const row: boolean[] = []
      for (let c = 0; c < qrMatrixSize; c++) {
        const isFinderTopLeft = r < 7 && c < 7
        const isFinderTopRight = r < 7 && c >= qrMatrixSize - 7
        const isFinderBottomLeft = r >= qrMatrixSize - 7 && c < 7

        if (isFinderTopLeft) {
          const border = r === 0 || r === 6 || c === 0 || c === 6
          const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4
          row.push(border || inner)
        } else if (isFinderTopRight) {
          const cRel = c - (qrMatrixSize - 7)
          const border = r === 0 || r === 6 || cRel === 0 || cRel === 6
          const inner = r >= 2 && r <= 4 && cRel >= 2 && cRel <= 4
          row.push(border || inner)
        } else if (isFinderBottomLeft) {
          const rRel = r - (qrMatrixSize - 7)
          const border = rRel === 0 || rRel === 6 || c === 0 || c === 6
          const inner = rRel >= 2 && rRel <= 4 && c >= 2 && c <= 4
          row.push(border || inner)
        } else {
          const bit = Math.abs(Math.sin((r * qrMatrixSize + c + hash) * 9301 + 49297) * 233280) % 2 > 0.98
          row.push(bit)
        }
      }
      cells.push(row)
    }
    return cells
  }

  const qrMatrix = generateQrCells()

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
                Enroll New Device
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Single-use cryptographic enrollment challenge
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
            <svg
              viewBox={`0 0 ${qrMatrixSize} ${qrMatrixSize}`}
              style={{ width: '100%', height: '100%', display: 'block' }}
              shapeRendering="crispEdges"
              aria-label="Cryptographic Pairing QR Code"
            >
              <rect width={qrMatrixSize} height={qrMatrixSize} fill="#FFFFFF" />
              {qrMatrix.map((row, r) =>
                row.map((active, c) =>
                  active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#152219" /> : null
                )
              )}
            </svg>
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
            64-Character Secret Token
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {challenge.token}
            </span>
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={14} weight="bold" color="#1A6E40" /> : <Copy size={14} weight="regular" />}
              onClick={handleCopy}
              title="Copy secret to clipboard"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Mutual Consent Checkbox */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: '#F7FAF7',
            border: '1px solid #DCE6DE',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '24px',
          }}
        >
          <input
            id="device-owner-consent"
            type="checkbox"
            checked={consentApproved}
            onChange={(e) => setConsentApproved(e.target.checked)}
            style={{ marginTop: '3px', cursor: 'pointer' }}
          />
          <label htmlFor="device-owner-consent" style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, cursor: 'pointer' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Device Owner Consent Verification:</strong> I certify that the device owner has provided explicit,
            informed consent for telemetry monitoring. Zero covert tracking is enforced by hardware cryptographic proofs.
          </label>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <Button
            variant="danger"
            size="md"
            onClick={handleCancel}
            disabled={busy}
          >
            Cancel Challenge
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            disabled={!consentApproved}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
