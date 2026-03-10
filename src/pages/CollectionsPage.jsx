import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, RsiButton, HexBadge } from '../components/ui/RSI'
import { useToast } from '../hooks/useToast'
import { formatTime } from '../components/library/GameCard'
import { PlatformBadge, StatusBadge } from '../components/ui/Badges'

const EMOJIS = ['⭐','🎮','🏆','🔥','👾','📚','⚡','🌙','🗡️','🎯','🚀','🌊','💀','🎲','🌿','🏰']
const COLORS = ['#00d4ff','#00e5a0','#f59e0b','#a855f7','#ef4444','#0a84ff','#f97316','#ec4899']

const INP = {
  width: '100%', background: '#060e18', border: `1px solid ${C.border}`,
  color: C.text, padding: '9px 12px', fontSize: 13, outline: 'none',
  fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.02em',
}

function CollectionModal({ existing, onClose, onSave }) {
  const [name,  setName]  = useState(existing?.name  || '')
  const [icon,  setIcon]  = useState(existing?.icon  || '🎮')
  const [color, setColor] = useState(existing?.color || '#00d4ff')
  const toast = useToast()

  function handleSave() {
    if (!name.trim()) { toast('Enter a name', 'error'); return }
    onSave({ ...(existing || {}), id: existing?.id || ('c' + Date.now()), name: name.trim(), icon, color, gameIds: existing?.gameIds || [] })
    onClose()
    toast(existing ? `Renamed to "${name}"` : `Collection "${name}" created`, 'success')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,8,14,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity:0, scale:0.96, y:10 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ background:'#080f1a', border:`1px solid ${color}44`, width:'100%', maxWidth:400, padding:24, clipPath:'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)', boxShadow:`0 24px 80px rgba(0,0,0,0.9), 0 0 30px ${color}0a`, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, width:12, height:12, borderTop:`2px solid ${color}`, borderLeft:`2px solid ${color}` }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, borderBottom:`2px solid ${color}44`, borderRight:`2px solid ${color}44` }} />

        <SectionHeader accent={color} style={{ marginBottom:18 }}>{existing ? 'Edit Collection' : 'New Collection'}</SectionHeader>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, display:'block', marginBottom:6 }}>Name</label>
          <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSave()} placeholder="My Collection" style={INP} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor=C.border} />
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, display:'block', marginBottom:6 }}>Icon</label>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setIcon(e)}
                style={{ width:34, height:34, background:icon===e?`${color}18`:'transparent', border:`1px solid ${icon===e?color+'44':C.border}`, fontSize:16, cursor:'pointer', transition:'all 0.12s' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, display:'block', marginBottom:6 }}>Accent Color</label>
          <div style={{ display:'flex', gap:7 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)}
                style={{ width:26, height:26, background:c, border:`2px solid ${color===c?'#fff':'transparent'}`, cursor:'pointer', transition:'border 0.15s', clipPath:'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }} />
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton>
          <RsiButton onClick={handleSave} variant="solid" size="sm" accent={color}>{existing ? 'SAVE' : 'CREATE'}</RsiButton>
        </div>
      </motion.div>
    </div>
  )
}

function AddGamesModal({ collection, games, onClose, onSave }) {
  const [selected, setSelected] = useState(new Set(collection.gameIds || []))
  const [search, setSearch] = useState('')
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const filtered = games.filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(4,8,14,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(6px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity:0, scale:0.96, y:10 }} animate={{ opacity:1, scale:1, y:0 }}
        style={{ background:'#080f1a', border:`1px solid ${collection.color}44`, width:'100%', maxWidth:500, padding:24, maxHeight:'82vh', display:'flex', flexDirection:'column', clipPath:'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)', boxShadow:`0 24px 80px rgba(0,0,0,0.9)`, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:0, width:12, height:12, borderTop:`2px solid ${collection.color}`, borderLeft:`2px solid ${collection.color}` }} />

        <SectionHeader accent={collection.color} style={{ marginBottom:6 }}>Manage "{collection.name}"</SectionHeader>

        {/* Search + count */}
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search games…"
            style={{ ...INP, flex:1, padding:'7px 10px', fontSize:12 }} onFocus={e=>e.target.style.borderColor=collection.color} onBlur={e=>e.target.style.borderColor=C.border} />
          <HexBadge color={collection.color}>{selected.size} SELECTED</HexBadge>
        </div>

        {/* Select all / clear */}
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          <button onClick={() => setSelected(new Set(filtered.map(g=>g.id)))}
            style={{ flex:1, padding:'4px 0', background:`${collection.color}0a`, border:`1px solid ${collection.color}28`, color:collection.color, fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            SELECT ALL
          </button>
          <button onClick={() => setSelected(new Set())}
            style={{ flex:1, padding:'4px 0', background:'transparent', border:`1px solid ${C.border}`, color:C.textDim, fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            CLEAR
          </button>
        </div>

        <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column', gap:4, marginBottom:16 }}>
          {filtered.map(g => {
            const sel = selected.has(g.id)
            return (
              <div key={g.id} onClick={() => toggle(g.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'7px 12px', background:sel?`${collection.color}10`:'#060e18', border:`1px solid ${sel?collection.color+'44':C.border}`, cursor:'pointer', transition:'all 0.12s', clipPath:'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
                <img src={g.coverUrl} alt="" style={{ width:28, height:40, objectFit:'cover', flexShrink:0 }} onError={e=>e.target.style.display='none'} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:C.text, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.title}</div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, marginTop:2 }}>{formatTime(g.playtime)}</div>
                </div>
                <div style={{ width:18, height:18, background:sel?collection.color:'#0a1420', border:`1px solid ${sel?collection.color:C.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, clipPath:'polygon(2px 0%,100% 0%,100% calc(100% - 2px),calc(100% - 2px) 100%,0% 100%,0% 2px)', transition:'all 0.12s' }}>
                  {sel && <Icon name="check" size={10} color="#080c12" />}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <RsiButton onClick={onClose} variant="ghost" size="sm">CANCEL</RsiButton>
          <RsiButton onClick={() => { onSave(collection.id, [...selected]); onClose() }} variant="solid" size="sm" accent={collection.color}>SAVE CHANGES</RsiButton>
        </div>
      </motion.div>
    </div>
  )
}

function CollectionDetail({ col, colGames, onClose, onManage, onEdit, onSelect, accent }) {
  const totalMins = colGames.reduce((s,g) => s + (g.playtime||0), 0)
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, background:'rgba(4,8,14,0.92)', zIndex:900, overflow:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'28px 20px', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }}
        style={{ width:'100%', maxWidth:860, background:'#080f1a', border:`1px solid ${col.color}44`, clipPath:'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)', boxShadow:`0 40px 120px rgba(0,0,0,0.95), 0 0 40px ${col.color}0a`, overflow:'hidden' }}>
        {/* Corner accents */}
        <div style={{ position:'absolute', top:0, left:0, width:16, height:16, borderTop:`2px solid ${col.color}`, borderLeft:`2px solid ${col.color}` }} />
        <div style={{ position:'absolute', top:0, left:16, right:0, height:1, background:`linear-gradient(to right, ${col.color}, transparent)` }} />

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:48, height:48, background:`${col.color}18`, border:`1px solid ${col.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, clipPath:'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', flexShrink:0 }}>{col.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:C.textBright }}>{col.name}</div>
            <div style={{ display:'flex', gap:16, marginTop:4 }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:col.color }}>{colGames.length} GAMES</span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim }}>{formatTime(totalMins)} TOTAL</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <RsiButton onClick={onEdit} variant="ghost" size="sm" accent={col.color}><Icon name="edit" size={12} color={C.textDim}/> EDIT</RsiButton>
            <RsiButton onClick={onManage} variant="primary" size="sm" accent={col.color}><Icon name="plus" size={12} color={col.color}/> MANAGE</RsiButton>
            <button onClick={onClose} style={{ background:'none', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=col.color;e.currentTarget.style.color=col.color}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim}}>
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        {/* Games grid */}
        <div style={{ padding:20 }}>
          {colGames.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:C.textDim }}>
              // EMPTY COLLECTION<br/>
              <button onClick={onManage} style={{ marginTop:12, background:'none', border:`1px solid ${col.color}44`, color:col.color, padding:'8px 18px', fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>+ ADD GAMES</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {colGames.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.03 }}
                  onClick={() => onSelect(g)}
                  style={{ display:'flex', alignItems:'center', gap:14, padding:'8px 12px', background:C.surface, border:`1px solid ${C.border}`, cursor:'pointer', clipPath:'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=col.color+'44'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim, width:20, flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                  <img src={g.coverUrl} alt="" style={{ width:32, height:46, objectFit:'cover', flexShrink:0, clipPath:'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }} onError={e=>e.target.style.display='none'} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.textBright, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.title}</div>
                    <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
                      <PlatformBadge platform={g.platform} small />
                      <StatusBadge status={g.status} />
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:col.color }}>{formatTime(g.playtime)}</div>
                    {g.rating > 0 && <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, marginTop:2 }}>{g.rating}/10</div>}
                  </div>
                  <Icon name="chevronRight" size={14} color={C.border} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CollectionsPage({ games, collections, onCollectionsChange, onSelectGame, accent = C.accent }) {
  const [showCreate,  setShowCreate]  = useState(false)
  const [editingCol,  setEditingCol]  = useState(null)  // collection being renamed/edited
  const [addingTo,    setAddingTo]    = useState(null)
  const [detailCol,   setDetailCol]   = useState(null)
  const toast = useToast()

  const DEFAULT_COLS = [
    { id:'c_fav',     name:'Favorites',   icon:'⭐', color:'#f59e0b', gameIds:[] },
    { id:'c_backlog', name:'Backlog',      icon:'📚', color:'#00d4ff', gameIds:[] },
    { id:'c_coop',    name:'Co-op Night',  icon:'👾', color:'#00e5a0', gameIds:[] },
    { id:'c_short',   name:'Short Games',  icon:'⚡', color:'#a855f7', gameIds:[] },
  ]
  const cols = collections.length > 0 ? collections : DEFAULT_COLS

  function handleSaveCollection(col) {
    const existing = cols.find(c => c.id === col.id)
    if (existing) onCollectionsChange(cols.map(c => c.id === col.id ? { ...c, ...col } : c))
    else           onCollectionsChange([...cols, col])
  }
  function handleDelete(id) {
    if (!window.confirm('Delete this collection?')) return
    onCollectionsChange(cols.filter(c => c.id !== id))
    if (detailCol?.id === id) setDetailCol(null)
    toast('Collection deleted', 'info')
  }
  function handleSaveGames(colId, gameIds) {
    onCollectionsChange(cols.map(c => c.id === colId ? { ...c, gameIds } : c))
    // Also update detailCol if open
    if (detailCol?.id === colId) setDetailCol(c => ({ ...c, gameIds }))
    toast('Collection updated', 'success')
  }

  const totalGames = games.length
  const collectionedIds = new Set(cols.flatMap(c => c.gameIds || []))

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ padding:20, overflow:'auto', height:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <SectionHeader accent={accent}>Collections</SectionHeader>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim, marginTop:2, letterSpacing:'0.06em', display:'flex', gap:16 }}>
            <span>{cols.length} COLLECTION{cols.length!==1?'S':''}</span>
            <span style={{ color:accent }}>{collectionedIds.size} / {totalGames} GAMES ORGANIZED</span>
          </div>
        </div>
        <RsiButton onClick={() => setShowCreate(true)} variant="primary" size="sm" accent={accent}>
          <Icon name="plus" size={12} color={accent} /> NEW COLLECTION
        </RsiButton>
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
        {cols.map(col => {
          const colGames  = games.filter(g => (col.gameIds||[]).includes(g.id))
          const totalMins = colGames.reduce((s,g) => s+(g.playtime||0), 0)

          return (
            <motion.div key={col.id} whileHover={{ y:-2 }}
              style={{ background:C.surface, border:`1px solid ${col.color}33`, clipPath:'polygon(10px 0%,100% 0%,100% calc(100% - 10px),calc(100% - 10px) 100%,0% 100%,0% 10px)', overflow:'hidden', boxShadow:`0 0 20px ${col.color}08`, transition:'border-color 0.2s, box-shadow 0.2s', position:'relative', cursor:'pointer' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 0 30px ${col.color}14`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow=`0 0 20px ${col.color}08`}
              onClick={() => setDetailCol(col)}>

              <div style={{ position:'absolute', top:0, left:0, width:10, height:10, borderTop:`2px solid ${col.color}`, borderLeft:`2px solid ${col.color}` }} />

              {/* Header */}
              <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, background:`${col.color}18`, border:`1px solid ${col.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, clipPath:'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
                  {col.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:C.textBright, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{col.name}</div>
                  <div style={{ display:'flex', gap:10, marginTop:2 }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:col.color }}>{colGames.length} GAME{colGames.length!==1?'S':''}</span>
                    {totalMins > 0 && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim }}>{formatTime(totalMins)}</span>}
                  </div>
                </div>
                {/* Action buttons - stop propagation so they don't open detail */}
                <div style={{ display:'flex', gap:4 }} onClick={e => e.stopPropagation()}>
                  <button onClick={e=>{e.stopPropagation();setEditingCol(col)}}
                    style={{ background:'none', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=col.color;e.currentTarget.style.color=col.color}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim}}>
                    <Icon name="edit" size={11} />
                  </button>
                  <button onClick={e=>{e.stopPropagation();handleDelete(col.id)}}
                    style={{ background:'none', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.color='#ef4444'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim}}>
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              </div>

              {/* Cover mosaic */}
              <div style={{ padding:12, minHeight:72 }}>
                {colGames.length > 0 ? (
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {colGames.slice(0,8).map(g => (
                      <img key={g.id} src={g.coverUrl} alt={g.title} title={g.title}
                        style={{ width:32, height:46, objectFit:'cover', clipPath:'polygon(2px 0%,100% 0%,100% calc(100% - 2px),calc(100% - 2px) 100%,0% 100%,0% 2px)', border:`1px solid ${C.border}` }}
                        onError={e=>e.target.style.display='none'} />
                    ))}
                    {colGames.length > 8 && (
                      <div style={{ width:32, height:46, background:'#060e18', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim }}>
                        +{colGames.length-8}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.border, textAlign:'center', paddingTop:10 }}>// EMPTY - CLICK TO ADD GAMES</div>
                )}
              </div>

              {/* Manage button */}
              <div style={{ padding:'0 12px 12px' }} onClick={e=>e.stopPropagation()}>
                <button onClick={e=>{e.stopPropagation();setAddingTo(col)}}
                  style={{ width:'100%', padding:'7px 0', background:`${col.color}0a`, border:`1px solid ${col.color}28`, color:col.color, fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=`${col.color}18`}
                  onMouseLeave={e=>e.currentTarget.style.background=`${col.color}0a`}>
                  + MANAGE GAMES
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {(showCreate) && (
          <CollectionModal onClose={() => setShowCreate(false)} onSave={col => { handleSaveCollection(col) }} />
        )}
        {editingCol && (
          <CollectionModal existing={editingCol} onClose={() => setEditingCol(null)} onSave={col => { handleSaveCollection(col); setEditingCol(null) }} />
        )}
        {addingTo && (
          <AddGamesModal collection={addingTo} games={games} onClose={() => setAddingTo(null)} onSave={handleSaveGames} />
        )}
        {detailCol && (
          <CollectionDetail
            col={detailCol}
            colGames={games.filter(g => (detailCol.gameIds||[]).includes(g.id))}
            onClose={() => setDetailCol(null)}
            onManage={() => { setAddingTo(detailCol); setDetailCol(null) }}
            onEdit={() => { setEditingCol(detailCol); setDetailCol(null) }}
            onSelect={g => { setDetailCol(null); onSelectGame?.(g) }}
            accent={accent}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
