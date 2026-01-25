import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlatformBadge, StatusBadge, StarButton } from '../ui/Badges'
import ContextMenu from '../ui/ContextMenu'
import Icon from '../ui/Icon'
import { STATUS_META } from '../../data/constants'
import { C as Colors } from '../ui/RSI'

export function formatTime(mins) {
  if (!mins) return '0h'
  const h = Math.floor(mins / 60), m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function timeAgo(isoDate) {
  if (!isoDate) return 'Never'
  const diff = Date.now() - new Date(isoDate).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7)  return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

function useCtxMenu() {
  const [menu, setMenu] = useState(null)
  const open = useCallback((e, items) => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY, items }) }, [])
  const close = useCallback(() => setMenu(null), [])
  return { menu, open, close }
}

export function GameCardGrid({ game, onSelect, onToggleFav, onEdit, onDelete, accent = Colors.accent, showAchBadges = true }) {
  const [hovered, setHovered] = useState(false)
  const { menu, open, close } = useCtxMenu()
  const sm = STATUS_META[game.status] || { color: '#4a6a85' }

  const items = [
    { icon: 'play',    label: 'Play Now',           onClick: () => onSelect(game) },
    { icon: 'info',    label: 'View Details',        onClick: () => onSelect(game) },
    { separator: true },
    { icon: 'star',    label: game.isFavorite ? 'Remove Favorite' : 'Add to Favorites', onClick: () => onToggleFav(game.id) },
    { icon: 'edit',    label: 'Edit Game',           onClick: () => onEdit?.(game) },
    { separator: true },
    { icon: 'trash',   label: 'Remove from Library', onClick: () => onDelete?.(game.id), danger: true },
  ]

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.15 }}
        onClick={() => onSelect(game)}
        onContextMenu={e => open(e, items)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: Colors.surface,
          border: `1px solid ${hovered ? sm.color + '55' : Colors.border}`,
          cursor: 'pointer', userSelect: 'none',
          clipPath: 'polygon(14px 0%,100% 0%,100% calc(100% - 14px),calc(100% - 14px) 100%,0% 100%,0% 14px)',
          boxShadow: hovered ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${sm.color}18` : '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Cover image area */}
        <div style={{ position: 'relative', paddingBottom: '140%', overflow: 'hidden', background: Colors.surface2 }}>
          <img src={game.coverUrl} alt={game.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            onError={e => e.target.style.display = 'none'}
            draggable={false}
          />
          {/* Hover overlay with play button */}
          <motion.div animate={{ opacity: hovered ? 1 : 0 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(5,10,18,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, background: `${accent}22`, border: `1px solid ${accent}66`, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${accent}44` }}>
              <Icon name="play" size={18} color={accent} />
            </div>
          </motion.div>

          {/* Scanline on hover */}
          {hovered && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.02) 3px,rgba(0,212,255,0.02) 4px)', pointerEvents: 'none' }} />}

          {/* Top: favorite */}
          <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={e => { e.stopPropagation(); onToggleFav(game.id) }}>
            <StarButton filled={game.isFavorite} size={16} />
          </div>

          {/* Status badge */}
          <div style={{ position: 'absolute', top: 6, left: 6 }}>
            <span style={{ background: sm.color + 'cc', color: '#fff', padding: '2px 6px', fontSize: 9, fontWeight: 700, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {STATUS_META[game.status]?.label}
            </span>
          </div>

          {/* Bottom gradient + platform + achievements */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(6,10,16,0.95) 0%, transparent 100%)', padding: '20px 8px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <PlatformBadge platform={game.platform} small />
              {game.achievements?.length > 0 && (() => {
                const unlocked = game.achievements.filter(a => a.unlocked).length
                const total    = game.achievements.length
                return (
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: unlocked === total ? '#f59e0b' : '#ffffff88', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {unlocked === total ? '★' : '🏆'} {unlocked}/{total}
                  </span>
                )
              })()}
            </div>
          </div>

          {/* Corner accent on hover */}
          {hovered && <>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
          </>}
        </div>

        {/* Info section */}
        <div style={{ padding: '8px 10px 10px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: Colors.textBright, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="clock" size={10} color={Colors.textDim} />
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: Colors.textDim }}>{formatTime(game.playtime)}</span>
            <span style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: Colors.textDim + '88' }}>{timeAgo(game.lastPlayed)}</span>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>{menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={close} />}</AnimatePresence>
    </>
  )
}

export function GameCardList({ game, onSelect, onToggleFav, onEdit, onDelete, accent = Colors.accent }) {
  const [hovered, setHovered] = useState(false)
  const { menu, open, close } = useCtxMenu()
  const sm = STATUS_META[game.status] || { color: '#4a6a85' }

  const items = [
    { icon: 'play', label: 'Play Now', onClick: () => onSelect(game) },
    { icon: 'info', label: 'View Details', onClick: () => onSelect(game) },
    { separator: true },
    { icon: 'star', label: game.isFavorite ? 'Remove Favorite' : 'Add to Favorites', onClick: () => onToggleFav(game.id) },
    { icon: 'edit', label: 'Edit', onClick: () => onEdit?.(game) },
    { separator: true },
    { icon: 'trash', label: 'Remove', onClick: () => onDelete?.(game.id), danger: true },
  ]

  return (
    <>
      <div
        onClick={() => onSelect(game)}
        onContextMenu={e => open(e, items)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '9px 14px',
          background: hovered ? Colors.surface2 : Colors.surface,
          border: `1px solid ${hovered ? sm.color + '44' : Colors.border}`,
          cursor: 'pointer', transition: 'all 0.15s', userSelect: 'none',
          clipPath: 'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)',
          boxShadow: hovered ? `0 0 16px ${sm.color}14` : 'none',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={game.coverUrl} alt={game.title} style={{ width: 40, height: 56, objectFit: 'cover', background: Colors.surface2, display: 'block', clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)', border: `1px solid ${hovered ? sm.color + '44' : Colors.border}` }} onError={e => e.target.style.background = Colors.surface2} />
          {hovered && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }}><Icon name="play" size={14} color={accent} /></div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: Colors.textBright, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <PlatformBadge platform={game.platform} small />
            <StatusBadge status={game.status} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          <Icon name="clock" size={11} color={Colors.textDim} />
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: Colors.textDim }}>{formatTime(game.playtime)}</span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: Colors.textDim, flexShrink: 0, minWidth: 72, textAlign: 'right' }}>{timeAgo(game.lastPlayed)}</div>
        {game.rating > 0 && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: '#f59e0b', flexShrink: 0 }}>★{game.rating}</div>}
        <div onClick={e => { e.stopPropagation(); onToggleFav(game.id) }} style={{ flexShrink: 0 }}><StarButton filled={game.isFavorite} size={15} /></div>
      </div>
      <AnimatePresence>{menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={close} />}</AnimatePresence>
    </>
  )
}
