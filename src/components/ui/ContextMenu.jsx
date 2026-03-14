import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { C } from './RSI'

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const key  = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('mousedown', down)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', key) }
  }, [onClose])

  const menuW = 210, menuH = items.length * 36 + 8
  const cx = Math.min(x, window.innerWidth - menuW - 8)
  const cy = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.1 }}
      style={{ position: 'fixed', left: cx, top: cy, zIndex: 3000, background: '#08111e', border: `1px solid ${C.border}`, boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 20px ${C.accent}12`, padding: '4px 0', minWidth: menuW, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', userSelect: 'none' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 6, right: 0, height: 1, background: `linear-gradient(to right, ${C.accent}66, transparent)` }} />
      {items.map((item, i) => {
        if (item.separator) return <div key={i} style={{ height: 1, background: C.border, margin: '3px 0' }} />
        return (
          <button key={i} onClick={() => { item.onClick(); onClose() }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '7px 14px', background: 'none', border: 'none', color: item.danger ? '#fca5a5' : C.text, fontSize: 12, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
            onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.12)' : `${C.accent}12`}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {item.icon && <Icon name={item.icon} size={13} color={item.danger ? '#fca5a5' : C.textDim} />}
            {item.label}
          </button>
        )
      })}
    </motion.div>
  )
}
