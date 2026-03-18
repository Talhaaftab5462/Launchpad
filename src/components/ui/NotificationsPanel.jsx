import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Icon from './Icon'
import { C, RsiButton } from './RSI'

const TYPE_META = {
  session:     { icon:'clock',   color:C.success },
  import:      { icon:'plus',    color:'#3b82f6' },
  achievement: { icon:'trophy',  color:'#f59e0b' },
  info:        { icon:'info',    color:C.accent  },
  error:       { icon:'x',       color:'#ef4444' },
}

function timeAgoShort(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'NOW'
  if (m < 60) return `${m}M`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}H`
  return `${Math.floor(h / 24)}D`
}

export default function NotificationsPanel({ notifications, unreadCount, onMarkAllRead, onMarkRead, onClearAll, onClose, accent = C.accent }) {
  const ref = useRef(null)
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const key = e => { if (e.key === 'Escape') onClose() }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('mousedown', handler); window.removeEventListener('keydown', key) }
  }, [onClose])

  return (
    <motion.div ref={ref} initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.97 }} transition={{ duration:0.15 }}
      style={{ position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:500, width:340, background:'#080f1a', border:`1px solid ${C.border}`, clipPath:'polygon(10px 0%,100% 0%,100% calc(100% - 10px),calc(100% - 10px) 100%,0% 100%,0% 10px)', boxShadow:`0 16px 48px rgba(0,0,0,0.8), 0 0 24px ${accent}0a`, overflow:'hidden' }}>
      {/* Top accent */}
      <div style={{ position:'absolute', top:0, left:10, right:0, height:1, background:`linear-gradient(to right, ${accent}66, transparent)`, pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:3, height:12, background:accent, boxShadow:`0 0 6px ${accent}` }} />
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.textBright }}>Notifications</span>
          {unreadCount > 0 && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, background:accent, color:'#080c12', borderRadius:2, padding:'1px 6px' }}>{unreadCount}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {unreadCount>0 && <button onClick={onMarkAllRead} style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:accent, background:'none', border:'none', cursor:'pointer' }}>MARK ALL READ</button>}
          {notifications.length>0 && <button onClick={onClearAll} style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:C.textDim, background:'none', border:'none', cursor:'pointer' }}>CLEAR</button>}
        </div>
      </div>

      <div style={{ maxHeight:380, overflowY:'auto' }}>
        {notifications.length===0 ? (
          <div style={{ padding:'36px 14px', textAlign:'center' }}>
            <Icon name="bell" size={28} color={C.border}/>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.textDim, marginTop:10 }}>NO NOTIFICATIONS</div>
          </div>
        ) : notifications.map(n => {
          const meta = TYPE_META[n.type] || TYPE_META.info
          return (
            <div key={n.id} onClick={()=>onMarkRead(n.id)}
              style={{ display:'flex', gap:10, padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:n.read?'transparent':`${accent}06`, cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background=C.surface2} onMouseLeave={e=>e.currentTarget.style.background=n.read?'transparent':`${accent}06`}>
              <div style={{ width:28, height:28, background:meta.color+'15', border:`1px solid ${meta.color}28`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, clipPath:'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }}>
                <Icon name={meta.icon} size={12} color={meta.color}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontSize:12, fontWeight:n.read?400:600, color:n.read?C.textDim:C.textBright, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, flexShrink:0 }}>{timeAgoShort(n.createdAt)}</span>
                </div>
                {n.body && <div style={{ fontSize:11, color:C.textDim, marginTop:2 }}>{n.body}</div>}
              </div>
              {!n.read && <div style={{ width:6, height:6, borderRadius:'50%', background:accent, boxShadow:`0 0 6px ${accent}`, flexShrink:0, marginTop:5 }}/>}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
