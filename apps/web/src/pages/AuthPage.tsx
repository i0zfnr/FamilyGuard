import { useState, type FormEvent } from 'react'
import {
  ShieldCheck,
  LockSimple,
  EnvelopeSimple,
  User as UserIcon,
  ArrowRight,
  ArrowUpRight,
  CircleNotch,
  Sparkle,
  Eye,
  EyeSlash,
  WarningCircle,
} from '@phosphor-icons/react'
import type { User } from '../types'
import { api, RequestError } from '../services/api'
import '../styles/auth.css'

export interface AuthPageProps {
  onAuthenticated: (user: User) => void
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isRegister) {
        if (password.length < 12) {
          setError('Password must contain at least 12 characters for cryptographic hardening.')
          setLoading(false)
          return
        }
        if (password !== confirmation) {
          setError('Password confirmations do not match.')
          setLoading(false)
          return
        }

        const res = await api.auth.register({
          name,
          email,
          password,
          password_confirmation: confirmation,
        })
        if (res.confirmationRequired) {
          setSuccess(res.message || 'Check your email for a confirmation link before signing in.')
        } else if (res.user) {
          onAuthenticated(res.user)
        }
      } else {
        const res = await api.auth.login({
          email,
          password,
        })
        if (res.user) {
          onAuthenticated(res.user)
        }
      }
    } catch (err) {
      if (err instanceof RequestError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected authentication error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-editorial-shell">
      {/* 2-Column Split Layout */}
      <div className="auth-editorial-layout">
        {/* Left Column: Deep Canvas Editorial Story */}
        <section className="auth-story-panel" aria-label="Brand narrative">
          {/* Story Top Navigation */}
          <div className="story-header">
            <div className="story-brand">
              <img
                src="/xennguard-icon.jpg"
                alt="XennGuard Logo"
                className="story-brand-mark"
              />
              <span className="story-brand-name">XennGuard</span>
            </div>
            <div className="story-edition">
              <span>FAMILY DEVICE CARE</span>
              <span className="edition-divider"> / </span>
              <span>01</span>
            </div>
          </div>

          {/* Story Hero Statement */}
          <div className="story-hero">
            <div className="story-badge">
              <span className="story-badge-dot" aria-hidden="true" />
              <span>CLOSER, EVEN FROM AFAR</span>
            </div>
            <h1 className="story-title">
              Care is always
              <br />
              <span className="story-title-highlight">within reach.</span>
            </h1>
            <p className="story-lead">
              A thoughtful way to stay connected to the devices and people that matter most.
            </p>
          </div>

          {/* Prismatic Dove Hero Artwork */}
          <div className="story-artwork-container" aria-hidden="true">
            <img
              src="/xennguard-icon.jpg"
              alt=""
              className="story-artwork-img"
            />
          </div>

          {/* Story Footer Metadata */}
          <div className="story-footer">
            <div className="story-footer-trust">
              <div className="story-trust-icon-box" aria-hidden="true">
                <Sparkle size={15} weight="fill" color="#95BD91" />
              </div>
              <p className="story-trust-text">
                For the people
                <br />
                <strong>you look out for.</strong>
              </p>
            </div>
            <div className="story-footer-connection">
              <span>DESIGNED FOR CONNECTION</span>
              <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* Right Column: Serene Porcelain Authentication Surface */}
        <section className="auth-form-panel" aria-label="Authentication form">
          {/* Form Header Status */}
          <div className="auth-panel-header">
            <span className="panel-subtitle">YOUR SPACE, MADE SIMPLE</span>
            <div className="panel-status-pill">
              <span className="status-indicator-dot" aria-hidden="true" />
              <span>DEVELOPMENT PREVIEW</span>
            </div>
          </div>

          {/* Authentication Card Form Container */}
          <div className="auth-card-container">
            {/* Ambient Vector Platter Icon */}
            <div className="auth-card-icon-box" aria-hidden="true">
              <ShieldCheck size={22} weight="regular" color="#265C38" />
            </div>

            <div className="auth-card-header">
              <p className="auth-eyebrow">WELCOME TO XENNGUARD</p>
              <h2 className="auth-heading">
                {isRegister ? 'Create account' : 'Welcome back.'}
              </h2>
              <p className="auth-description">
                {isRegister
                  ? 'A little setup now, more peace of mind later.'
                  : 'Sign in to keep the important things close.'}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="auth-error-banner" role="alert">
                <WarningCircle size={18} weight="fill" className="auth-error-icon" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="auth-success-banner" role="status">
                <ShieldCheck size={18} weight="fill" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
              {isRegister && (
                <div className="form-group">
                  <label htmlFor="auth-name" className="form-label">
                    Full name
                  </label>
                  <div className="input-wrapper">
                    <UserIcon size={18} weight="regular" className="input-icon" aria-hidden="true" />
                    <input
                      id="auth-name"
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      required
                      maxLength={100}
                      placeholder="Your full name"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email" className="form-label">
                  Email address
                </label>
                <div className="input-wrapper">
                  <EnvelopeSimple size={18} weight="regular" className="input-icon" aria-hidden="true" />
                  <input
                    id="auth-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="auth-password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <LockSimple size={18} weight="regular" className="input-icon" aria-hidden="true" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    required
                    minLength={isRegister ? 12 : undefined}
                    placeholder={isRegister ? 'At least 12 characters' : 'Enter your password'}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide value' : 'Reveal value'}
                  >
                    {showPassword ? (
                      <EyeSlash size={18} weight="regular" />
                    ) : (
                      <Eye size={18} weight="regular" />
                    )}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="form-group">
                  <label htmlFor="auth-confirm-password" className="form-label">
                    Confirm password
                  </label>
                  <div className="input-wrapper">
                    <LockSimple size={18} weight="regular" className="input-icon" aria-hidden="true" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      placeholder="Repeat your password"
                    />
                  </div>
                </div>
              )}

              {/* Security & Hardware Token Trust Badge */}
              <div className="security-notice-row">
                <LockSimple size={14} weight="regular" className="security-notice-icon" aria-hidden="true" />
                <span>Protected by hardware tokens & end-to-end encryption</span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                className="auth-primary-btn"
                disabled={loading}
                aria-label={isRegister ? 'Create master account' : 'Sign in to workspace'}
              >
                <span>
                  {loading
                    ? 'Please wait…'
                    : isRegister
                      ? 'Create Master Account'
                      : 'Sign in'}
                </span>
                {loading ? (
                  <CircleNotch size={18} weight="bold" className="animate-spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                )}
              </button>
            </form>

            {/* Switch Mode Prompt */}
            <div className="auth-switch-section">
              <span className="auth-switch-text">
                {isRegister ? 'Already have an account?' : 'New to XennGuard?'}
              </span>
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                }}
              >
                <span>{isRegister ? 'Sign in to workspace' : 'Create account'}</span>
                <span aria-hidden="true"> →</span>
              </button>
            </div>
          </div>

          {/* Form Footer */}
          <footer className="auth-panel-footer">
            <span>© XennGuard</span>
            <span>Thoughtful technology for everyday life.</span>
          </footer>
        </section>
      </div>
    </div>
  )
}
export default AuthPage
