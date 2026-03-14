import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlatformBadge, StatusBadge } from './Badges'
import Icon from './Icon'
import { C, RsiSpinner } from './RSI'
import { formatTime, timeAgo } from '../library/GameCard'

export default function CommandPalette({ games, onSelect, onClose, accent = C.accent }) {
  const [query, setQuery]   = useState('')
  const [focused, setFocused] = useState(0)
  const inputRef = useRef(null)
  const listRef  = useRef(null)

  const results = query.trim()
    ? games.filter(g => {
        const q = query.toLowerCase()
        return g.title.toLowerCase().includes(q) || (g.developer||'').toLowerCase().includes(q) || (g.genre||[]).some(x=>x.toLowerCase().includes(q)) || (g.platform||'').toLowerCase().includes(q) || (g.status||'').toLowerCase().includes(q)
      }).slice(0, 9)
    : [...games].filter(g=>g.lastPlayed).sort((a,b)=>new Date(b.lastPlayed)-new Date(a.lastPlayed)).slice(0,6)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 60) }, [])
  useEffect(() => { setFocused(0) }, [query])
  useEffect(() => {
    const handler = e => {
      if (e.key==='ArrowDown') { e.preventDefault(); setFocused(f=>Math.min(f+1,results.length-1)) }
      if (e.key==='ArrowUp')   { e.preventDefault(); setFocused(f=>Math.max(f-1,0)) }
      if (e.key==='Enter'&&results[focused]) { onSelect(results[focused]); onClose() }
      if (e.key==='Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused, results, onSelect, onClose])
  useEffect(() => { listRef.current?.children[focused]?.scrollIntoView({ block:'nearest' }) }, [focused])

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}
      style={{ position:'fixed', inset:0, background:'rgba(4,8,14,0.88)', zIndex:2000, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'12vh', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity:0, scale:0.96, y:-12 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:-8 }} transition={{ duration:0.18, ease:[0.16,1,0.3,1] }}
        style={{ width:'100%', maxWidth:560, background:'#060e18', border:`1px solid ${accent}44`, clipPath:'polygon(14px 0%,100% 0%,100% calc(100% - 14px),calc(100% - 14px) 100%,0% 100%,0% 14px)', boxShadow:`0 32px 96px rgba(0,0,0,0.95), 0 0 40px ${accent}12`, overflow:'hidden' }}>
        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:14, right:0, height:1, background:`linear-gradient(to right, ${accent}, transparent)`, pointerEvents:'none' }} />

        {/* Input */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:`1px solid ${C.border}` }}>
          <Icon name="search" size={16} color={C.textDim}/>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="SEARCH LIBRARY…"
            style={{ flex:1, background:'none', border:'none', color:C.text, fontSize:14, outline:'none', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, letterSpacing:'0.06em' }} />
          {query && <button onClick={()=>setQuery('')} style={{ background:'none', border:'none', color:C.textDim, cursor:'pointer', padding:2, display:'flex' }}><Icon name="x" size={14}/></button>}
          <kbd style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, padding:'2px 6px' }}>ESC</kbd>
        </div>

        <div style={{ padding:'6px 16px 4px', fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:C.textDim }}>
          {query.trim() ? `${results.length} RESULT${results.length!==1?'S':''}` : 'RECENT ACTIVITY'}
        </div>

        <div ref={listRef} style={{ maxHeight:380, overflowY:'auto', paddingBottom:8 }}>
          {results.length===0 ? (
            <div style={{ padding:'24px 16px', textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>NO RECORDS MATCH "{query}"</div>
          ) : results.map((game,i) => (
            <div key={game.id} onClick={()=>{onSelect(game);onClose()}} onMouseEnter={()=>setFocused(i)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', cursor:'pointer', background:focused===i?`${accent}12`:'transparent', borderLeft:`2px solid ${focused===i?accent:'transparent'}`, transition:'all 0.1s' }}>
              <img src={game.coverUrl} alt="" style={{ width:28, height:40, objectFit:'cover', flexShrink:0, background:C.surface2, clipPath:'polygon(2px 0%,100% 0%,100% calc(100% - 2px),calc(100% - 2px) 100%,0% 100%,0% 2px)' }} onError={e=>e.target.style.display='none'} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:focused===i?'#fff':C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{game.title}</div>
                <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                  <PlatformBadge platform={game.platform} small/>
                  <StatusBadge status={game.status}/>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim }}>{formatTime(game.playtime)}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, marginTop:1 }}>{timeAgo(game.lastPlayed)}</div>
              </div>
              {focused===i && <kbd style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, padding:'1px 5px', flexShrink:0 }}>↵</kbd>}
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:16, padding:'8px 16px', borderTop:`1px solid ${C.border}` }}>
          {[['↑↓','NAVIGATE'],['↵','OPEN'],['ESC','CLOSE']].map(([key,desc])=>(
            <div key={key} style={{ display:'flex', gap:5, alignItems:'center' }}>
              <kbd style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, padding:'1px 5px' }}>{key}</kbd>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:C.textDim }}>{desc}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
