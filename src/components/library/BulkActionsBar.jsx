import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../ui/Icon'
import { C } from '../ui/RSI'
import { STATUS_META } from '../../data/constants'

export default function BulkActionsBar({ selectedIds, onClear, onDelete, onSetStatus, onFavorite, accent = C.accent }) {
  const count = selectedIds.length
  if (count === 0) return null
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.15 }}
      style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#080e18', border: `1px solid ${accent}44`, boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 30px ${accent}18`, display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', zIndex: 400, clipPath: 'polygon(10px 0%,100% 0%,100% calc(100% - 10px),calc(100% - 10px) 100%,0% 100%,0% 10px)', backdropFilter: 'blur(8px)' }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 10, right: 0, height: 1, background: `linear-gradient(to right, ${accent}88, transparent)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 10px', marginRight: 4 }}>
        <div style={{ width: 20, height: 20, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#080c12', fontFamily: "'Rajdhani',sans-serif", clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }}>{count}</div>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: '#aaa', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{count === 1 ? 'GAME' : 'GAMES'} SELECTED</span>
      </div>
      <div style={{ width: 1, height: 22, background: C.border, margin: '0 4px' }} />

      <div style={{ position: 'relative' }}>
        <select onChange={e => { if (e.target.value) { onSetStatus(e.target.value); e.target.value = '' } }} defaultValue=""
          style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text, padding: '5px 10px', fontSize: 11, cursor: 'pointer', appearance: 'none', paddingRight: 24, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
          <option value="" disabled style={{ background: '#0d1520' }}>SET STATUS…</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k} style={{ background: '#0d1520' }}>{v.label}</option>)}
        </select>
        <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon name="chevronDown" size={10} color={C.textDim} />
        </div>
      </div>

      <button onClick={() => onFavorite(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f59e0b18', border: '1px solid #f59e0b33', color: '#f59e0b', fontSize: 11, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
        <Icon name="star" size={11} color="#f59e0b" /> FAV
      </button>
      <div style={{ width: 1, height: 22, background: C.border, margin: '0 4px' }} />
      <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 11, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
        <Icon name="trash" size={11} color="#fca5a5" /> REMOVE
      </button>
      <button onClick={onClear} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, color: C.textDim, cursor: 'pointer', marginLeft: 4, clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
        <Icon name="x" size={13} color={C.textDim} />
      </button>
    </motion.div>
  )
}
