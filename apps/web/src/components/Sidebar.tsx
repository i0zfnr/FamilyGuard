import React from 'react'
import {
  DeviceMobileCamera,
  ActivityIcon as Activity,
  ShieldCheck,
  Sliders,
  Circle,
} from '@phosphor-icons/react'
import type { User, Device } from '../types'

export type SidebarTab = 'devices' | 'activity' | 'security' | 'settings'

export interface SidebarProps {
  user: User | null
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  devices?: Device[]
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onTabChange,
  devices = [],
}) => {
  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'

  const totalCount = devices.length

  return (
    <aside
      className="app-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        height: '100vh',
        backgroundColor: '#0A0E0C',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        zIndex: 50,
        boxSizing: 'border-box',
        overflowY: 'auto',
      }}
      aria-label="Application Sidebar"
    >
      {/* 1. Brand Header */}
      <div
        className="sidebar-brand-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '28px',
          padding: '0 8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#15251C',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
              flexShrink: 0,
            }}
          >
            <img
              src="/xennguard-icon.jpg"
              alt="XennGuard Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
              }}
            >
              xenn
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#A2C49E' }}>.</span>
          </div>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#6E8074',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}
        >
          Your Little Universe
        </span>
      </div>

      {/* 2. Primary Navigation Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
        {/* Devices Nav Item */}
        <button
          type="button"
          onClick={() => onTabChange('devices')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            border: activeTab === 'devices' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
            background: activeTab === 'devices' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            color: activeTab === 'devices' ? '#FFFFFF' : '#8A9E91',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            textAlign: 'left',
          }}
          aria-current={activeTab === 'devices' ? 'page' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DeviceMobileCamera size={18} weight={activeTab === 'devices' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Devices</span>
          </div>
          {activeTab === 'devices' && (
            <Circle size={6} weight="fill" color="#A2C49E" aria-hidden="true" />
          )}
        </button>

        {/* Activity Nav Item */}
        <button
          type="button"
          onClick={() => onTabChange('activity')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            border: activeTab === 'activity' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
            background: activeTab === 'activity' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            color: activeTab === 'activity' ? '#FFFFFF' : '#8A9E91',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            textAlign: 'left',
          }}
          aria-current={activeTab === 'activity' ? 'page' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={18} weight={activeTab === 'activity' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Activity</span>
          </div>
          {activeTab === 'activity' && (
            <Circle size={6} weight="fill" color="#A2C49E" aria-hidden="true" />
          )}
        </button>

        {/* Security Nav Item */}
        <button
          type="button"
          onClick={() => onTabChange('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            border: activeTab === 'security' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
            background: activeTab === 'security' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            color: activeTab === 'security' ? '#FFFFFF' : '#8A9E91',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            textAlign: 'left',
          }}
          aria-current={activeTab === 'security' ? 'page' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={18} weight={activeTab === 'security' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Security</span>
          </div>
          {activeTab === 'security' && (
            <Circle size={6} weight="fill" color="#A2C49E" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* 3. Section Divider */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          margin: '0 8px 20px',
        }}
      />

      {/* Device filters live on the Devices page to keep navigation focused. */}
      <div style={{ flex: 1, padding: '4px 10px', color: '#8A9E91' }}>
        <span style={{ display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E8074' }}>
          Connected devices
        </span>
        <strong style={{ display: 'block', marginTop: '8px', fontSize: '14px', color: '#FFFFFF' }}>
          {totalCount} {totalCount === 1 ? 'device' : 'devices'}
        </strong>
      </div>

      {/* 5. Bottom Pinned Section */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Settings Nav Button */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 600,
            border: activeTab === 'settings' ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid transparent',
            background: activeTab === 'settings' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            color: activeTab === 'settings' ? '#FFFFFF' : '#8A9E91',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            textAlign: 'left',
          }}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sliders size={18} weight={activeTab === 'settings' ? 'bold' : 'regular'} aria-hidden="true" />
            <span>Settings</span>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#55685C',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            WEB BETA
          </span>
        </button>

        {/* User Account / Sign Out Platter */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#1F3C2B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                aria-hidden="true"
              >
                {userInitial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#E8EFEA',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user.email}
                >
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#AAB9AE',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user.email}
                >
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
