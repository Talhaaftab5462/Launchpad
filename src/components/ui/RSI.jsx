import React from 'react'
import _imgSteam    from '../../assets/platforms/steam.png'
import _imgEpic     from '../../assets/platforms/epic.png'
import _imgGog      from '../../assets/platforms/gog.png'
import _imgXbox     from '../../assets/platforms/xbox.png'
import _imgPs       from '../../assets/platforms/playstation.png'
import _imgItchio   from '../../assets/platforms/itchio.png'
import _imgEmulator from '../../assets/platforms/retroarch.png'
import _imgRsi      from '../../assets/platforms/rsi.png'
import _imgBattle   from '../../assets/platforms/battlenet.png'
import _imgUbisoft  from '../../assets/platforms/ubisoft.png'
import _imgRockstar from '../../assets/platforms/rockstar.png'

export const C = {
  bg:       '#080c12',
  bgDeep:   '#04080e',
  surface:  '#0d1520',
  surface2: '#111b28',
  border:   '#1a2d45',
  borderBright: 'rgba(0,212,255,0.2)',
  accent:   '#00d4ff',
  accent2:  '#0a84ff',
  text:     '#c8dce8',
  textDim:  '#4a6a85',
  textBright: '#e8f4ff',
  success:  '#00e5a0',
  warning:  '#f59e0b',
  danger:   '#ef4444',
  purple:   '#a855f7',
}

export function Panel({ children, style, glow, clip = true, accent = C.accent }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${glow ? accent + '44' : C.border}`,
      position: 'relative',
      ...(clip ? { clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)' } : {}),
      boxShadow: glow ? `0 0 24px ${accent}18, inset 0 0 24px ${accent}06` : 'none',
      ...style
    }}>
      {/* Corner accents */}
      {clip && <>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}`, zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}`, zIndex: 1 }} />
      </>}
      {children}
    </div>
  )
}

export function SectionHeader({ children, accent = C.accent, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, ...style }}>
      <div style={{ width: 3, height: 14, background: accent, flexShrink: 0, boxShadow: `0 0 8px ${accent}` }} />
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${accent}33, transparent)` }} />
    </div>
  )
}

export function DataReadout({ label, value, accent = C.accent, size = 'normal' }) {
  const big = size === 'large'
  return (
    <div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: big ? "'Rajdhani', sans-serif" : "'Share Tech Mono', monospace", fontSize: big ? 28 : 16, fontWeight: big ? 700 : 400, color: accent, letterSpacing: big ? '0.02em' : '0.05em', textShadow: `0 0 12px ${accent}66` }}>
        {value}
      </div>
    </div>
  )
}

export function RsiButton({ children, onClick, variant = 'primary', size = 'md', disabled = false, style, accent = C.accent }) {
  const pad = size === 'sm' ? '5px 12px' : size === 'lg' ? '12px 28px' : '8px 20px'
  const fs  = size === 'sm' ? 12 : size === 'lg' ? 15 : 13

  const styles = {
    primary: {
      background: `linear-gradient(135deg, ${accent}22, ${accent}0a)`,
      border: `1px solid ${accent}66`,
      color: accent,
      boxShadow: `0 0 12px ${accent}22`,
    },
    solid: {
      background: accent,
      border: `1px solid ${accent}`,
      color: '#080c12',
      boxShadow: `0 0 20px ${accent}44`,
    },
    ghost: {
      background: 'transparent',
      border: `1px solid ${C.border}`,
      color: C.textDim,
    },
    danger: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#fca5a5',
    },
  }

  const s = styles[variant] || styles.primary

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: pad, fontSize: fs, fontWeight: 600,
        fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)',
        transition: 'all 0.15s',
        ...s, ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = `0 0 24px ${accent}44` }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.boxShadow = s.boxShadow || 'none' }}
    >
      {children}
    </button>
  )
}

export function HexBadge({ children, color = C.accent, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: color + '18', border: `1px solid ${color}44`,
      color, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      padding: '2px 8px',
      clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)',
      ...style
    }}>
      {children}
    </span>
  )
}

export function RsiProgress({ value, max, accent = C.accent, height = 4 }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100))
  return (
    <div style={{ height, background: C.border, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(to right, ${accent}88, ${accent})`, boxShadow: `0 0 8px ${accent}`, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export function RsiSpinner({ size = 20, accent = C.accent }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid ${accent}22`, borderTop: `2px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  )
}

export function RsiDivider({ accent = C.accent }) {
  return (
    <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${accent}33, transparent)`, margin: '12px 0' }} />
  )
}

// Map internal platform keys → PNG filenames in src/assets/platforms/
const PLATFORM_IMG = {
  steam:    _imgSteam,
  epic:     _imgEpic,
  gog:      _imgGog,
  xbox:     _imgXbox,
  ps:       _imgPs,
  itchio:   _imgItchio,
  emulator: _imgEmulator,
  rsi:      _imgRsi,
  battle:   _imgBattle,
  ubisoft:  _imgUbisoft,
  rockstar: _imgRockstar,
}

export function PlatformSVG({ platform, size = 16, color }) {
  const src = PLATFORM_IMG[platform]
  if (src) {
    return (
      <img
        src={src}
        alt={platform}
        width={size}
        height={size}
        style={{
          width: size, height: size,
          objectFit: 'contain',
          flexShrink: 0,
          imageRendering: 'auto',
        }}
        onError={e => { e.target.style.display = 'none' }}
      />
    )
  }
  // Fallback SVG for 'other' or unknown platforms
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke={color || '#4a6a85'} strokeWidth="1.5"/>
      <path d="M9 12h6M12 9v6" stroke={color || '#4a6a85'} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
