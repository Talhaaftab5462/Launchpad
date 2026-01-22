import React from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { C } from './RSI'

export default function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,14,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.18 }}
        style={{ background: C.surface, border: `1px solid ${C.border}`, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: `0 24px 80px rgba(0,0,0,0.9), 0 0 40px ${C.accent}12`, clipPath: 'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)' }}>
        {/* Corner accents */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 3, height: 16, background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textBright }}>{title}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.accent} onMouseLeave={e => e.currentTarget.style.color = C.textDim}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ padding: '20px 24px' }}>{children}</div>
      </motion.div>
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
