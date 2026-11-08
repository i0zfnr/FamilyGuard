import { Plus, SignOut, ActivityIcon as Activity } from '@phosphor-icons/react'
import { Button } from './Button'
import type { User } from '../types'

export interface HeaderPlatterProps {
  user: User | null
  activeTab: 'devices' | 'audit' | 'settings'
  onTabChange: (tab: 'devices' | 'audit' | 'settings') => void
  onPairDevice: () => void
  onSignOut: () => void
  serverConnected?: boolean
  busy?: boolean
}

export function HeaderPlatter({
  user,
  activeTab,
  onTabChange,
  onPairDevice,
  onSignOut,
  serverConnected = true,
  busy = false,
}: HeaderPlatterProps) {
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'

  return (
    <header className="header-platter liquid-glass-platter" role="banner">
      <div className="header-brand">
        <div className="brand-icon-box" aria-hidden="true">
          <img src="/xennguard-icon.jpg" alt="XennGuard Logo" />
        </div>
        <span className="brand-title">XennGuard</span>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`nav-pill ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => onTabChange('devices')}
          aria-current={activeTab === 'devices' ? 'page' : undefined}
        >
          Devices
        </button>
        <button
          type="button"
          className={`nav-pill ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => onTabChange('audit')}
          aria-current={activeTab === 'audit' ? 'page' : undefined}
        >
          Audit Logs
        </button>
        <button
          type="button"
          className={`nav-pill ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          Settings
        </button>
      </nav>

      <div className="header-actions">
        <div className="server-status-pill" title="Backend connection status">
          <Activity size={14} weight="bold" className="status-dot pulse" aria-hidden="true" />
          <span>{serverConnected ? 'Connected' : 'Connecting'}</span>
        </div>

        {user && (
          <div className="user-pill" title={`${user.name} (${user.email})`}>
            <div className="user-avatar" aria-hidden="true">
              {userInitial}
            </div>
            <span>{user.name}</span>
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} weight="bold" />}
          onClick={onPairDevice}
          disabled={busy}
        >
          Pair Device
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<SignOut size={16} weight="bold" />}
          onClick={onSignOut}
          disabled={busy}
          title="Sign out of XennGuard"
          aria-label="Sign out"
        />
      </div>
    </header>
  )
}
