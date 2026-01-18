import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Icon from '../ui/Icon'
import NotificationsPanel from '../ui/NotificationsPanel'
import { C, RsiButton } from '../ui/RSI'

export default function TopBar({ onAdd, onOpenPalette, onOpenProfile, accent = C.accent, notifications = {}, runningGame = null, profile = {} }) {
  const [showNotifs, setShowNotifs] = useState(false)
  const isElectron = !!window.electronAPI
  const { list = [], unreadCount = 0, markAllRead, markRead, clearAll } = notifications

  return (
    <div style={{
      height: 52, background: '#060a10', borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
      flexShrink: 0, WebkitAppRegion: 'drag', position: 'relative',
      boxShadow: `0 1px 0 0 ${accent}18`,
    }}>
      {/* Subtle scan line at bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(to right, transparent, ${accent}22, transparent)`, pointerEvents: 'none' }} />

      {isElectron && <div style={{ width: 70, flexShrink: 0 }} />}

      {/* Search trigger */}
      <div onClick={() => onOpenPalette?.()}
        style={{ flex: 1, maxWidth: 440, WebkitAppRegion: 'no-drag', cursor: 'pointer', position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.surface, border: `1px solid ${C.border}`, padding: '6px 12px', transition: 'border-color 0.15s', clipPath: 'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = accent + '44'}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
        >
          <Icon name="search" size={14} color={C.textDim} />
          <span style={{ flex: 1, fontSize: 13, color: C.textDim, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em' }}>SEARCH LIBRARY…</span>
          <div style={{ display: 'flex', gap: 3 }}>
            <kbd style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim, background: C.surface2, border: `1px solid ${C.border}`, padding: '1px 5px' }}>CTRL</kbd>
            <kbd style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim, background: C.surface2, border: `1px solid ${C.border}`, padding: '1px 5px' }}>K</kbd>
          </div>
        </div>
      </div>

      {/* Running game beacon */}
      {runningGame && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.22)', padding: '5px 12px', WebkitAppRegion: 'no-drag', flexShrink: 0, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.success, boxShadow: `0 0 8px ${C.success}`, animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: C.success, letterSpacing: '0.08em', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{runningGame.title.toUpperCase()}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto', WebkitAppRegion: 'no-drag' }}>
        <RsiButton onClick={onAdd} variant="primary" size="sm" accent={accent}>
          <Icon name="plus" size={12} color={accent} />
          ADD GAME
        </RsiButton>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(v => !v)}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showNotifs ? `${accent}18` : C.surface, border: `1px solid ${showNotifs ? accent + '44' : C.border}`, color: showNotifs ? accent : C.textDim, cursor: 'pointer', transition: 'all 0.15s', position: 'relative', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '44'; e.currentTarget.style.color = accent }}
            onMouseLeave={e => { if (!showNotifs) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim } }}
          >
            <Icon name="bell" size={15} />
            {unreadCount > 0 && <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: accent, boxShadow: `0 0 6px ${accent}`, border: `1px solid #060a10` }} />}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <NotificationsPanel notifications={list} unreadCount={unreadCount} onMarkAllRead={markAllRead} onMarkRead={markRead} onClearAll={clearAll} onClose={() => setShowNotifs(false)} accent={accent} />
            )}
          </AnimatePresence>
        </div>

        {/* Profile avatar button */}
        <div onClick={() => onOpenProfile?.()}
          title="View Profile"
          style={{ width: 30, height: 30, background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, color: accent, cursor: 'pointer', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', boxShadow: `0 0 10px ${accent}22`, overflow: 'hidden', transition: 'box-shadow 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 16px ${accent}55`}
          onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 10px ${accent}22`}>
          {profile?.avatarUrl
            ? <img src={profile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            : <span>{profile?.displayName ? profile.displayName.slice(0,2).toUpperCase() : 'LP'}</span>
          }
        </div>

        {isElectron && (
          <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
            {[['minimize','−'],['maximize','□'],['close','×']].map(([action, label]) => (
              <button key={action} onClick={() => window.electronAPI[action]()}
                style={{ width: 26, height: 26, background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = action === 'close' ? '#ef444422' : `${accent}18`; e.currentTarget.style.color = action === 'close' ? '#fca5a5' : accent; e.currentTarget.style.borderColor = action === 'close' ? '#ef444444' : accent + '44' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.border }}
              >{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
