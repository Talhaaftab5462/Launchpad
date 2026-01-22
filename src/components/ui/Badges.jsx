import React from 'react'
import { PLATFORM_META, STATUS_META } from '../../data/constants'
import { PlatformSVG } from './RSI'

export function PlatformBadge({ platform, small }) {
  const m = PLATFORM_META[platform] || PLATFORM_META.other
  const sz = small ? 10 : 12
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.color, border: `1px solid ${m.border}`,
      color: m.accent, borderRadius: 3, padding: small ? '1px 6px' : '2px 8px',
      fontSize: sz, fontWeight: 700, whiteSpace: 'nowrap',
      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase',
      clipPath: small ? 'none' : 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)',
    }}>
      <PlatformSVG platform={platform} size={small ? 10 : 12} color={m.accent} />
      {m.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#4a6a85', glow: 'transparent' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: m.color + '15', border: `1px solid ${m.color}44`,
      color: m.color, borderRadius: 3, padding: '2px 8px',
      fontSize: 11, fontWeight: 700,
      fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, boxShadow: `0 0 6px ${m.color}` }} />
      {m.label}
    </span>
  )
}

export function StarButton({ filled, size = 16, onClick }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#1a2d45'}
      strokeWidth="1.8"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', flexShrink: 0, filter: filled ? 'drop-shadow(0 0 4px #f59e0b88)' : 'none' }}
      onClick={onClick}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
