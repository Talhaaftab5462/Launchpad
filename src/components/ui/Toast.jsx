import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { C } from './RSI'

export function ToastContainer({ toasts }) {
  return (
    <div style={{ position:'fixed', bottom:24, right:24, display:'flex', flexDirection:'column', gap:8, zIndex:9999, pointerEvents:'none' }}>
      <AnimatePresence>
        {toasts.map(t => {
          const colors = { error:['#ef444422','#ef444466'], success:[`${C.success}15`,`${C.success}44`], info:[`${C.accent}12`,`${C.accent}33`] }
          const [bg, border] = colors[t.type] || colors.info
          return (
            <motion.div key={t.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} transition={{ duration:0.18 }}
              style={{ background:'#060e18', border:`1px solid ${border}`, color:C.text, padding:'10px 16px', fontSize:13, boxShadow:`0 4px 20px rgba(0,0,0,0.6)`, minWidth:240, pointerEvents:'auto', clipPath:'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, letterSpacing:'0.04em' }}>
              {/* Accent line */}
              <div style={{ position:'absolute', top:0, left:8, right:0, height:1, background:`linear-gradient(to right, ${border}, transparent)`, pointerEvents:'none' }} />
              {t.msg}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
