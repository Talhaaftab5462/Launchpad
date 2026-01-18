import React from 'react'
import { motion } from 'framer-motion'
import Icon from '../ui/Icon'
import Logo from '../ui/Logo'
import { C, RsiDivider } from '../ui/RSI'
import { formatTime } from '../library/GameCard'

const NAV = [
  { key: 'home',        icon: 'home',        label: 'Home' },
  { key: 'library',     icon: 'library',     label: 'Library' },
  { key: 'platforms',   icon: 'platforms',   label: 'Platforms' },
  { key: 'collections', icon: 'collections', label: 'Collections' },
  { key: 'stats',       icon: 'stats',       label: 'Statistics' },
  { key: 'friends',     icon: 'users',       label: 'Friends' },
  { key: 'settings',    icon: 'settings',    label: 'Settings' },
]

export default function Sidebar({ current, onNav, collapsed, onToggle, accent = C.accent, runningGame = null, games = [] }) {
  const recent = [...games]
    .filter(g => g.lastPlayed && (!runningGame || g.id !== runningGame.id))
    .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
    .slice(0, 4)

  return (
    <motion.div
      animate={{ width: collapsed ? 56 : 228 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      style={{
        background: '#060a10',
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Vertical accent line */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 1, height: '100%', background: `linear-gradient(to bottom, transparent, ${accent}44, ${accent}22, transparent)`, pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 0' : '16px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${C.border}`, justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 56 }}>
        <div style={{ width: 26, height: 26, background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, border: `1px solid ${accent}66`, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 12px ${accent}33` }}>
          <Logo size={14} accent={accent} />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textBright, lineHeight: 1 }}>LAUNCHPAD</div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: accent, letterSpacing: '0.2em', marginTop: 1 }}>MISSION CONTROL</div>
          </div>
        )}
      </div>

      {/* Running game */}
      {runningGame && (
        <div style={{ margin: collapsed ? '8px 6px 0' : '8px 10px 0', background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.25)', padding: collapsed ? '6px 0' : '8px 10px', display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.success, boxShadow: `0 0 8px ${C.success}`, animation: 'glow-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: C.success, textTransform: 'uppercase' }}>Now Playing</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#6ee7b7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{runningGame.title}</div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(item => {
          const active = current === item.key
          return (
            <button key={item.key} onClick={() => onNav(item.key)} title={collapsed ? item.label : ''}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '10px 0' : '9px 18px',
                background: active ? `${accent}12` : 'transparent',
                color: active ? accent : C.textDim,
                fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
                borderLeft: `2px solid ${active ? accent : 'transparent'}`,
                borderRight: 'none', borderTop: 'none', borderBottom: 'none',
                textAlign: 'left', transition: 'all 0.15s', cursor: 'pointer',
                justifyContent: collapsed ? 'center' : 'flex-start', whiteSpace: 'nowrap',
                boxShadow: active ? `inset 0 0 20px ${accent}08` : 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = `${accent}07` } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.textDim; e.currentTarget.style.background = 'transparent' } }}
            >
              <Icon name={item.icon} size={16} color={active ? accent : 'currentColor'} />
              {!collapsed && item.label}
            </button>
          )
        })}

        {/* Recent */}
        {!collapsed && recent.length > 0 && (
          <div style={{ margin: '12px 0 0' }}>
            <div style={{ padding: '0 18px', marginBottom: 8 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textDim }}>Recent Activity</div>
              <div style={{ height: 1, background: `linear-gradient(to right, ${C.border}, transparent)`, marginTop: 4 }} />
            </div>
            {recent.map(g => (
              <button key={g.id} onClick={() => onNav('library')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '5px 18px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = `${accent}08`}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <img src={g.coverUrl} alt="" style={{ width: 24, height: 34, objectFit: 'cover', flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }} onError={e => e.target.style.display = 'none'} />
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim, marginTop: 1 }}>{formatTime(g.playtime)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <button onClick={onToggle}
        style={{ padding: collapsed ? '10px 0' : '10px 18px', background: 'none', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', color: C.textDim, gap: 8, fontSize: 11, borderTop: `1px solid ${C.border}`, transition: 'color 0.15s', cursor: 'pointer', border: 'none', borderTop: `1px solid ${C.border}`, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}
        onMouseEnter={e => e.currentTarget.style.color = accent}
        onMouseLeave={e => e.currentTarget.style.color = C.textDim}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <Icon name="chevronLeft" size={14} color="currentColor" />
        </motion.div>
        {!collapsed && 'Collapse'}
      </button>
    </motion.div>
  )
}
