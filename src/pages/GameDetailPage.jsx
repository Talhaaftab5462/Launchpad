import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PlatformBadge, StatusBadge, StarButton } from '../components/ui/Badges'
import Icon from '../components/ui/Icon'
import { PLATFORM_META, STATUS_META } from '../data/constants'
import { C, Panel, SectionHeader, DataReadout, RsiButton, RsiSpinner, RsiDivider, HexBadge } from '../components/ui/RSI'
import { formatTime, timeAgo } from '../components/library/GameCard'
import PlaytimeTracker from '../components/ui/PlaytimeTracker'

const RARITY_COLOR = { Common:'#4a6a85', Uncommon:'#10b981', Rare:'#3b82f6', Epic:'#8b5cf6', Legendary:'#f59e0b' }
const RARITY_ORDER = ['Common','Uncommon','Rare','Epic','Legendary']

// Generate deterministic achievements from game title seed
function generateAchievements(game) {
  const pools = {
    Common:    [['First Blood','Win your first encounter','⚔️'],['Foothold','Establish a base of operations','🏠'],['Survivor','Survive the first hour','🛡️'],['Night Owl','Play for 5 total hours','🦉'],['Explorer','Discover 25% of the map','🗺️'],['Armorer','Collect 10 different weapons','🔫']],
    Uncommon:  [['Veteran','Reach level 20','🎖️'],['Tactician','Complete 15 missions','📋'],['Collector','Find 50 hidden items','🎁'],['Speed Freak','Finish a race in record time','🏎️'],['Strategist','Win without taking damage','💡']],
    Rare:      [['Completionist','Finish all side quests','✅'],['Ghost','Complete a mission undetected','👻'],['Berserker','Defeat 100 enemies in one session','💀'],['Architect','Build a fully upgraded base','🏗️']],
    Epic:      [['Speed Runner','Complete main story under 8h','⚡'],['Perfectionist','Achieve 100% completion','🌟'],['Ironman','No deaths in a full run','⚡']],
    Legendary: [['Legend','Reach maximum rank','👑'],['Immortal','Defeat the final boss on hardest difficulty','☠️'],['The One','Unlock every other achievement','🏆']],
  }
  // Use title chars to seed selection
  const seed = game.title.split('').reduce((s,c) => s + c.charCodeAt(0), 0)
  const achievements = []
  let id = 1
  const counts = { Common: 3, Uncommon: 2, Rare: 2, Epic: 2, Legendary: 1 }
  RARITY_ORDER.forEach(rarity => {
    const pool = pools[rarity]
    const count = counts[rarity]
    for (let i = 0; i < count; i++) {
      const pick = pool[(seed + i * 7 + id * 3) % pool.length]
      // Auto-unlock some based on playtime
      const hoursNeeded = { Common: 1, Uncommon: 5, Rare: 20, Epic: 50, Legendary: 100 }[rarity]
      const autoUnlocked = (game.playtime / 60) >= hoursNeeded
      achievements.push({ id: id++, title: pick[0], desc: pick[1], icon: pick[2], rarity, unlocked: autoUnlocked, unlockedAt: autoUnlocked ? game.lastPlayed : null })
    }
  })
  return achievements
}

function ChartTooltip({ active, payload }) {
  if (active && payload?.length && payload[0].value > 0) return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderBright}`, padding:'6px 10px', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.accent }}>
      {payload[0].payload.label} · {formatTime(payload[0].payload.minutes)}
    </div>
  )
  return null
}

function RatingBar({ rating = 0, accent, onRate }) {
  const [hover, setHover] = React.useState(0)
  const display = hover || rating
  return (
    <div style={{ display:'flex', gap:2, alignItems:'center' }} onMouseLeave={() => setHover(0)}>
      {[...Array(10)].map((_, i) => (
        <div key={i}
          onMouseEnter={() => setHover(i + 1)}
          onClick={() => onRate?.(i + 1)}
          style={{ width: 12, height: 4, background: i < display ? accent : C.border, boxShadow: i < display ? `0 0 4px ${accent}88` : 'none', cursor:'pointer', transition:'background 0.1s, box-shadow 0.1s', transform: hover && i < hover ? 'scaleY(1.4)' : 'scaleY(1)', transformOrigin:'bottom' }} />
      ))}
      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color: display ? accent : C.textDim, marginLeft:6, minWidth:28 }}>
        {display ? `${display}/10` : 'RATE'}
      </span>
    </div>
  )
}

export default function GameDetailPage({ game, onClose, onEdit, onDelete, onToggleFav, onUpdateNotes, onToggleAchievement, onSeedAchievements, onSaveScreenshots, onRateGame, onStatusChange, onSaveGoal, onApplyScLogs, launcher, accent = C.accent, bgBlur = 3 }) {
  const [tab, setTab]           = useState('overview')
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const STATUSES = ['playing','backlog','completed','dropped','wishlist']
  const [notes, setNotes]       = useState(game.notes || '')
  const [editingNotes, setEditing] = useState(false)
  const notesRef                = useRef(null)

  const bg         = game.backgroundUrl || game.coverUrl
  const totalHours = (game.playtime / 60).toFixed(1)

  // Use persisted achievements or generate from seed
  const achievements = React.useMemo(() => {
    if (game.achievements?.length) return game.achievements
    return generateAchievements(game)
  }, [game.achievements, game.id, game.playtime])

  // Seed on first open if not yet stored
  React.useEffect(() => {
    if (!game.achievements?.length && onSeedAchievements) {
      onSeedAchievements(game.id, generateAchievements(game))
    }
  }, [game.id])

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const [achFilter,   setAchFilter]   = React.useState('all')
  const [scImporting, setScImporting] = React.useState(false)
  const [scResult,    setScResult]    = React.useState(null) // { sessions, totalMins, sessionCount, filesScanned }
  const [scError,     setScError]     = React.useState(null)
  const isElectron = typeof window.launchpad !== 'undefined'
  const [goalHours,  setGoalHours]  = React.useState(game.playtimeGoal ? Math.floor(game.playtimeGoal / 60) : '')
  const [editingGoal, setEditingGoal] = React.useState(false)
  const [screenshots, setScreenshots] = React.useState(game.screenshots || [])
  const [newSsUrl, setNewSsUrl]       = React.useState('')
  const [lightbox,  setLightbox]      = React.useState(null) // url or null

  // Persist screenshots back to library when they change
  React.useEffect(() => {
    if (onUpdateNotes && JSON.stringify(screenshots) !== JSON.stringify(game.screenshots || [])) {
      onSaveScreenshots?.(game.id, screenshots)
    }
  }, [screenshots])

  const sessionData = (() => {
    const map = {}
    ;(game.sessions || []).forEach(s => { map[s.date] = (map[s.date] || 0) + s.duration })
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000)
      const key = d.toISOString().split('T')[0]
      return { date: key, label: d.toLocaleDateString('en', { month:'short', day:'numeric' }), minutes: map[key] || 0, hours: +((map[key] || 0) / 60).toFixed(1) }
    })
  })()

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.18 }}
      style={{ position:'fixed', inset:0, background:'rgba(4,8,14,0.9)', zIndex:900, overflow:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'28px 20px', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:12 }} transition={{ duration:0.2 }}
        style={{ width:'100%', maxWidth:940, background:'#080f1a', border:`1px solid ${C.border}`, clipPath:'polygon(20px 0%,100% 0%,100% calc(100% - 20px),calc(100% - 20px) 100%,0% 100%,0% 20px)', boxShadow:`0 40px 120px rgba(0,0,0,0.95), 0 0 60px ${accent}0a`, overflow:'hidden' }}>

        {/* Hero */}
        <div style={{ position:'relative', height:280, overflow:'hidden', background:C.surface }}>
          {bg && <img src={bg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.3, filter:`blur(${bgBlur}px) saturate(0.6)`, transform:'scale(1.05)' }} onError={e=>e.target.style.display='none'} />}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(8,15,26,0.2) 0%, #080f1a 100%)' }} />
          {/* Scanlines */}
          <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.012) 3px,rgba(0,212,255,0.012) 4px)', pointerEvents:'none' }} />
          {/* Corner accents */}
          <div style={{ position:'absolute', top:0, left:0, width:20, height:20, borderTop:`2px solid ${accent}`, borderLeft:`2px solid ${accent}` }} />
          <div style={{ position:'absolute', top:0, right:0, width:20, height:20, borderTop:`1px solid ${accent}44`, borderRight:`1px solid ${accent}44` }} />

          <button onClick={onClose} style={{ position:'absolute', top:14, right:14, background:'rgba(8,15,26,0.8)', border:`1px solid ${C.border}`, color:C.textDim, padding:'5px 12px', display:'flex', alignItems:'center', gap:6, fontSize:11, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', transition:'color 0.15s' }} onMouseEnter={e=>e.currentTarget.style.color=accent} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}>
            <Icon name="x" size={12}/> CLOSE
          </button>

          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 28px 22px', display:'flex', gap:20, alignItems:'flex-end' }}>
            <img src={game.coverUrl} alt={game.title} style={{ width:100, height:140, objectFit:'cover', flexShrink:0, border:`1px solid ${accent}44`, boxShadow:`0 8px 32px rgba(0,0,0,0.8), 0 0 24px ${accent}18`, clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }} onError={e=>e.target.style.display='none'} />
            <div style={{ flex:1, paddingBottom:4 }}>
              <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
                <PlatformBadge platform={game.platform} />
                {/* Clickable status badge - opens inline picker */}
                <div style={{ position:'relative' }}>
                  <div onClick={e => { e.stopPropagation(); setShowStatusPicker(s => !s) }} style={{ cursor:'pointer' }}>
                    <StatusBadge status={game.status} />
                  </div>
                  {showStatusPicker && (
                    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'#080f1a', border:`1px solid ${accent}44`, zIndex:200, minWidth:140, clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', boxShadow:`0 12px 40px rgba(0,0,0,0.9)` }}>
                      {STATUSES.map(s => (
                        <div key={s}
                          onClick={e => { e.stopPropagation(); onStatusChange?.(game.id, s); setShowStatusPicker(false) }}
                          style={{ padding:'8px 14px', cursor:'pointer', background: game.status===s ? `${STATUS_META[s]?.color}15` : 'transparent', display:'flex', alignItems:'center', gap:8, transition:'background 0.1s', borderLeft:`2px solid ${game.status===s ? STATUS_META[s]?.color : 'transparent'}` }}
                          onMouseEnter={e => { if(game.status!==s) e.currentTarget.style.background = `${STATUS_META[s]?.color}0a` }}
                          onMouseLeave={e => { if(game.status!==s) e.currentTarget.style.background = 'transparent' }}>
                          <div style={{ width:6, height:6, borderRadius:'50%', background:STATUS_META[s]?.color, boxShadow:`0 0 5px ${STATUS_META[s]?.color}` }} />
                          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: game.status===s ? STATUS_META[s]?.color : C.text }}>{STATUS_META[s]?.label}</span>
                          {game.status===s && <Icon name="check" size={10} color={STATUS_META[s]?.color} style={{ marginLeft:'auto' }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {game.releaseYear && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>{game.releaseYear}</span>}
              </div>
              <h1 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:30, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase', color:'#fff', marginBottom:6, lineHeight:1.1, textShadow:`0 2px 20px rgba(0,0,0,0.8)` }}>{game.title}</h1>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:C.textDim }}>
                {game.developer}{game.publisher&&game.publisher!==game.developer?` // ${game.publisher}`:''}
              </div>
              {/* Inline star rating - click to set, hover to preview */}
              <div style={{ display:'flex', gap:3, marginTop:8, alignItems:'center' }}>
                <RatingBar rating={game.rating} accent={accent} onRate={r => onRateGame?.(game.id, r)} />
              </div>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div style={{ display:'flex', gap:10, padding:'16px 28px', borderBottom:`1px solid ${C.border}`, alignItems:'center', flexWrap:'wrap' }}>
          <PlaytimeTracker game={game} launcher={launcher} accent={accent} />
          <RsiButton onClick={()=>onToggleFav(game.id)} variant={game.isFavorite?'primary':'ghost'} size="sm" accent="#f59e0b">
            <StarButton filled={game.isFavorite} size={13} /> {game.isFavorite?'FAVORITED':'FAVORITE'}
          </RsiButton>
          <RsiButton onClick={()=>{onClose();onEdit(game)}} variant="ghost" size="sm">
            <Icon name="edit" size={12} color={C.textDim}/> EDIT
          </RsiButton>
          <RsiButton onClick={()=>{if(window.confirm(`Remove "${game.title}"?`)){onDelete(game.id);onClose()}}} variant="danger" size="sm">
            <Icon name="trash" size={12} color="#fca5a5"/> REMOVE
          </RsiButton>

          {/* Star Citizen log import - RSI platform only */}
          {game.platform === 'rsi' && isElectron && (
            <RsiButton
              variant="primary" size="sm" accent="#00d4ff"
              disabled={scImporting}
              onClick={async () => {
                setScError(null); setScResult(null)
                const folder = await window.launchpad.pickFolder()
                if (!folder) return
                setScImporting(true)
                try {
                  const result = await window.launchpad.parseScLogs({ folderPath: folder })
                  if (!result.success) { setScError(result.error); return }
                  setScResult(result)
                } catch(e) { setScError(e.message) }
                finally { setScImporting(false) }
              }}>
              {scImporting
                ? <><RsiSpinner size={12} accent="#00d4ff" /> SCANNING…</>
                : <><Icon name="folder" size={12} color="#00d4ff" /> IMPORT SC LOGS</>
              }
            </RsiButton>
          )}
          <div style={{ marginLeft:'auto', display:'flex', gap:20 }}>
            {[[formatTime(game.playtime),'Playtime'],[timeAgo(game.lastPlayed),'Last Session'],[game.sessions?.length||0,'Sessions']].map(([v,l])=>(
              <div key={l} style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:14, color:accent }}>{v}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.textDim, marginTop:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:0, padding:'0 28px', borderBottom:`1px solid ${C.border}` }}>
          {['overview','sessions','achievements','screenshots'].map(t => (
            <button key={t} onClick={()=>setTab(t)}
              style={{ padding:'10px 18px', background:'none', border:'none', borderBottom:`2px solid ${tab===t?accent:'transparent'}`, color:tab===t?accent:C.textDim, fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s', boxShadow:tab===t?`0 2px 12px ${accent}33`:'' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding:28, minHeight:320 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.14 }}>

              {tab==='overview' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:24 }}>
                  <div>
                    {game.description && <>
                      <SectionHeader accent={accent}>About</SectionHeader>
                      <p style={{ fontSize:13, color:C.textDim, lineHeight:1.75, marginBottom:20 }}>{game.description}</p>
                    </>}
                    {game.genre?.length>0 && (
                      <div style={{ marginBottom:20 }}>
                        <SectionHeader accent={accent}>Genres</SectionHeader>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {game.genre.map(g=><HexBadge key={g} color={accent}>{g}</HexBadge>)}
                        </div>
                      </div>
                    )}
                    {game.tags?.length>0 && (
                      <div style={{ marginBottom:20 }}>
                        <SectionHeader accent={accent}>Tags</SectionHeader>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {game.tags.map(t=><HexBadge key={t} color={C.textDim}>#{t}</HexBadge>)}
                        </div>
                      </div>
                    )}
                    <SectionHeader accent={accent}>Notes</SectionHeader>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <span />
                      {!editingNotes
                        ? <button onClick={()=>{setEditing(true);setTimeout(()=>notesRef.current?.focus(),50)}} style={{ background:'none', border:'none', color:C.textDim, fontSize:11, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:5 }} onMouseEnter={e=>e.currentTarget.style.color=accent} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="edit" size={12} color={C.textDim}/> EDIT</button>
                        : <div style={{ display:'flex', gap:8 }}>
                            <button onClick={()=>{setNotes(game.notes||'');setEditing(false)}} style={{ background:'none', border:'none', color:C.textDim, fontSize:11, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>CANCEL</button>
                            <button onClick={()=>{onUpdateNotes(game.id,notes);setEditing(false)}} style={{ background:accent+'22', border:`1px solid ${accent}44`, color:accent, fontSize:11, padding:'3px 10px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>SAVE</button>
                          </div>
                      }
                    </div>
                    {editingNotes
                      ? <textarea ref={notesRef} value={notes} onChange={e=>setNotes(e.target.value)} style={{ width:'100%', minHeight:90, background:'#060e18', border:`1px solid ${accent}44`, color:C.text, padding:'10px 12px', fontSize:13, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.6 }} />
                      : <div onClick={()=>setEditing(true)} style={{ color:notes?C.textDim:'#253850', fontSize:13, lineHeight:1.7, background:'#060e18', border:`1px solid ${C.border}`, padding:'10px 12px', minHeight:56, cursor:'text', fontFamily:notes?'inherit':"'Share Tech Mono',monospace" }}>
                          {notes||'// NO NOTES - CLICK TO ADD'}
                        </div>
                    }
                  </div>

                  <div>
                    <SectionHeader accent={accent}>Details</SectionHeader>
                    {/* Playtime Goal */}
                    <div style={{ marginBottom:16 }}>
                      <SectionHeader accent={accent}>Playtime Goal</SectionHeader>
                      {game.playtimeGoal ? (
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim }}>{formatTime(game.playtime)} / {Math.floor(game.playtimeGoal/60)}h goal</span>
                            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color: game.playtime >= game.playtimeGoal ? '#00e5a0' : accent }}>
                              {game.playtime >= game.playtimeGoal ? '✓ COMPLETE' : `${Math.min(100,Math.round((game.playtime/game.playtimeGoal)*100))}%`}
                            </span>
                          </div>
                          <div style={{ height:4, background:C.border, overflow:'hidden' }}>
                            <div style={{ width:`${Math.min(100,(game.playtime/(game.playtimeGoal||1))*100)}%`, height:'100%', background: game.playtime>=game.playtimeGoal ? '#00e5a0' : accent, boxShadow:`0 0 8px ${accent}`, transition:'width 0.4s ease' }} />
                          </div>
                          <button onClick={() => setEditingGoal(true)} style={{ marginTop:6, background:'none', border:'none', color:C.textDim, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>CHANGE GOAL</button>
                        </div>
                      ) : editingGoal ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <input autoFocus type="number" min="1" max="10000" value={goalHours}
                            onChange={e=>setGoalHours(e.target.value)}
                            onKeyDown={e=>{ if(e.key==='Enter'&&goalHours){ onSaveGoal?.(game.id, Number(goalHours)*60); setEditingGoal(false) } if(e.key==='Escape') setEditingGoal(false) }}
                            placeholder="Hours"
                            style={{ width:70, background:'#060e18', border:`1px solid ${accent}44`, color:C.text, padding:'5px 8px', fontSize:12, outline:'none', fontFamily:"'Share Tech Mono',monospace" }} />
                          <span style={{ color:C.textDim, fontSize:11 }}>hours</span>
                          <RsiButton size="sm" variant="solid" accent={accent} onClick={()=>{ if(goalHours){ onSaveGoal?.(game.id, Number(goalHours)*60); setEditingGoal(false) }}}>SET</RsiButton>
                          <RsiButton size="sm" variant="ghost" onClick={()=>setEditingGoal(false)}>✕</RsiButton>
                        </div>
                      ) : (
                        <button onClick={()=>setEditingGoal(true)} style={{ background:'none', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'5px 12px', display:'flex', alignItems:'center', gap:5, width:'100%', justifyContent:'center', transition:'border-color 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.borderColor=accent+'55'}
                          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                          <Icon name="plus" size={11} color={C.textDim} /> SET PLAYTIME GOAL
                        </button>
                      )}
                    </div>

                    {[['Developer',game.developer],['Publisher',game.publisher],['Release',game.releaseYear],['Platform',PLATFORM_META[game.platform]?.label],['Status',STATUS_META[game.status]?.label],['Rating',game.rating?`${game.rating}/10`:null],['Total Playtime',formatTime(game.playtime)],['Date Added',game.dateAdded?new Date(game.dateAdded).toLocaleDateString():null]].filter(([,v])=>v).map(([k,v])=>(
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:`1px solid ${C.border}` }}>
                        <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:C.textDim }}>{k}</span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.text, textAlign:'right', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==='sessions' && (
                <div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
                    {[[formatTime(game.playtime),'Total Playtime','clock'],[game.sessions?.length||0,'Sessions','stats'],[game.sessions?.length?formatTime(Math.round(game.playtime/game.sessions.length)):'-','Avg Session','zap']].map(([v,l,icon])=>(
                      <Panel key={l} style={{ padding:'14px 16px' }}>
                        <DataReadout label={l} value={v} accent={accent} />
                      </Panel>
                    ))}
                  </div>
                  <SectionHeader accent={accent}>Last 14 Days</SectionHeader>
                  <div style={{ background:'#060e18', border:`1px solid ${C.border}`, padding:'14px 8px 8px', marginBottom:16 }}>
                    {sessionData.some(d=>d.minutes>0) ? (
                      <ResponsiveContainer width="100%" height={120}>
                        <BarChart data={sessionData} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                          <XAxis dataKey="label" tick={{ fontSize:9, fill:C.textDim, fontFamily:"'Share Tech Mono',monospace" }} tickLine={false} axisLine={false} interval={2} />
                          <YAxis tick={{ fontSize:9, fill:C.textDim }} tickLine={false} axisLine={false} tickFormatter={v=>v>0?`${v}h`:''} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill:`${accent}08` }} />
                          <Bar dataKey="hours" fill={accent} radius={[1,1,0,0]} opacity={0.85} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>NO SESSION DATA</div>
                    )}
                  </div>
                  {game.sessions?.length>0 && (
                    <>
                      <SectionHeader accent={accent}>Session Log</SectionHeader>
                      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        {[...game.sessions].reverse().slice(0,10).map((s,i)=>(
                          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:'#060e18', border:`1px solid ${C.border}` }}>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <div style={{ width:6, height:6, background:accent, boxShadow:`0 0 6px ${accent}` }} />
                              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.text }}>{new Date(s.date).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</span>
                            </div>
                            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:accent }}>{formatTime(s.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab==='achievements' && (
                <div>
                  {/* Header stats */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', gap:24 }}>
                      <div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:32, fontWeight:700, color:C.textBright, lineHeight:1 }}>{unlockedCount}<span style={{ fontSize:18, color:C.textDim, fontWeight:400 }}>/{achievements.length}</span></div>
                        <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, marginTop:2 }}>ACHIEVEMENTS UNLOCKED</div>
                      </div>
                      {/* Rarity breakdown */}
                      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                        {RARITY_ORDER.map(r => {
                          const total = achievements.filter(a=>a.rarity===r).length
                          const done  = achievements.filter(a=>a.rarity===r&&a.unlocked).length
                          if (!total) return null
                          return (
                            <div key={r} style={{ textAlign:'center' }}>
                              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, color:done===total?RARITY_COLOR[r]:C.textDim }}>{done}/{total}</div>
                              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:RARITY_COLOR[r], letterSpacing:'0.06em' }}>{r.slice(0,4).toUpperCase()}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      {['all','unlocked','locked'].map(f => (
                        <button key={f} onClick={()=>setAchFilter(f)} style={{ padding:'4px 10px', background:achFilter===f?`${accent}18`:'transparent', border:`1px solid ${achFilter===f?accent+'55':C.border}`, color:achFilter===f?accent:C.textDim, fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.15s' }}>{f}</button>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height:3, background:C.border, overflow:'hidden', marginBottom:18 }}>
                    <div style={{ width:`${achievements.length?((unlockedCount/achievements.length)*100):0}%`, height:'100%', background:`linear-gradient(to right,${accent}88,${accent})`, boxShadow:`0 0 8px ${accent}`, transition:'width 0.5s ease' }} />
                  </div>

                  {/* Achievement grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {achievements
                      .filter(a => achFilter==='all' || (achFilter==='unlocked'&&a.unlocked) || (achFilter==='locked'&&!a.unlocked))
                      .map(a => {
                        const rc = RARITY_COLOR[a.rarity]
                        return (
                          <motion.div key={a.id} whileHover={{ scale:1.01 }}
                            onClick={() => onToggleAchievement && onToggleAchievement(game.id, a.id)}
                            style={{ display:'flex', gap:12, padding:'12px 14px', background: a.unlocked ? `${rc}08` : '#060e18', border:`1px solid ${a.unlocked?rc+'44':C.border}`, opacity:1, cursor:'pointer', transition:'all 0.2s', clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', position:'relative', overflow:'hidden' }}>
                            {/* Glow sweep for unlocked */}
                            {a.unlocked && <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(to right,transparent,${rc}88,transparent)` }} />}
                            <div style={{ width:40, height:40, background:a.unlocked?rc+'18':'#0a0f16', border:`1px solid ${a.unlocked?rc+'55':C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0, clipPath:'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', transition:'all 0.2s', filter:a.unlocked?'none':'grayscale(1) brightness(0.4)' }}>
                              {a.icon}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                                <span style={{ fontSize:13, fontWeight:600, color:a.unlocked?C.textBright:C.textDim }}>{a.title}</span>
                                {a.unlocked && <Icon name="check" size={11} color={C.success}/>}
                              </div>
                              <div style={{ fontSize:11, color:C.textDim, marginBottom:5, lineHeight:1.4 }}>{a.desc}</div>
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <HexBadge color={rc} style={{ fontSize:8 }}>{a.rarity}</HexBadge>
                                {a.unlocked && a.unlockedAt && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim }}>{new Date(a.unlockedAt).toLocaleDateString()}</span>}
                                {!a.unlocked && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.border }}>CLICK TO MARK UNLOCKED</span>}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    }
                  </div>
                  {achievements.filter(a => achFilter==='all' || (achFilter==='unlocked'&&a.unlocked) || (achFilter==='locked'&&!a.unlocked)).length === 0 && (
                    <div style={{ textAlign:'center', padding:'40px 0', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>NO {achFilter.toUpperCase()} ACHIEVEMENTS</div>
                  )}
                </div>
              )}
              {tab==='screenshots' && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <SectionHeader accent={accent} style={{ marginBottom:0 }}>Screenshots</SectionHeader>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim }}>{screenshots.length} IMAGE{screenshots.length!==1?'S':''}</span>
                  </div>

                  {/* Add URL */}
                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    <input
                      value={newSsUrl} onChange={e=>setNewSsUrl(e.target.value)} placeholder="Paste screenshot URL…"
                      style={{ flex:1, background:'#060e18', border:`1px solid ${C.border}`, color:C.text, padding:'8px 12px', fontSize:12, outline:'none', fontFamily:"'Share Tech Mono',monospace" }}
                      onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor=C.border}
                      onKeyDown={e=>{
                        if (e.key==='Enter' && newSsUrl.trim()) {
                          const updated = [...screenshots, newSsUrl.trim()]
                          setScreenshots(updated)
                          setNewSsUrl('')
                        }
                      }}
                    />
                    <RsiButton variant="primary" size="sm" accent={accent}
                      onClick={() => { if(newSsUrl.trim()){ setScreenshots(s=>[...s,newSsUrl.trim()]); setNewSsUrl('') } }}
                      disabled={!newSsUrl.trim()}>
                      ADD
                    </RsiButton>
                  </div>

                  {screenshots.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'40px 0', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>
                      // NO SCREENSHOTS - PASTE A URL ABOVE TO ADD ONE
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:8 }}>
                      {screenshots.map((url, i) => (
                        <motion.div key={i} whileHover={{ scale:1.02 }} style={{ position:'relative', cursor:'pointer', background:C.surface, border:`1px solid ${C.border}`, overflow:'hidden', clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }}>
                          <img src={url} alt={`Screenshot ${i+1}`}
                            style={{ width:'100%', aspectRatio:'16/9', objectFit:'cover', display:'block' }}
                            onClick={() => setLightbox(url)}
                            onError={e=>{e.target.style.display='none'; e.target.parentElement.style.minHeight='80px'}} />
                          <button onClick={() => setScreenshots(s=>s.filter((_,j)=>j!==i))}
                            style={{ position:'absolute', top:4, right:4, background:'rgba(8,12,18,0.85)', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.color='#ef4444'}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.textDim}}>
                            <Icon name="x" size={10} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Lightbox */}
                  {lightbox && (
                    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}
                      onClick={() => setLightbox(null)}>
                      <img src={lightbox} alt="" style={{ maxWidth:'92vw', maxHeight:'88vh', objectFit:'contain', boxShadow:`0 0 60px ${accent}22` }} />
                      <button onClick={()=>setLightbox(null)} style={{ position:'fixed', top:20, right:20, background:'rgba(8,12,18,0.8)', border:`1px solid ${C.border}`, color:C.textDim, cursor:'pointer', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── SC Log Import Result Modal ──────────────────────────────── */}
      <AnimatePresence>
        {(scResult || scError) && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:'fixed',inset:0,background:'rgba(4,8,14,0.92)',zIndex:1100,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'}}
            onClick={e=>{if(e.target===e.currentTarget){setScResult(null);setScError(null)}}}>
            <motion.div initial={{opacity:0,scale:0.96,y:10}} animate={{opacity:1,scale:1,y:0}}
              style={{background:'#080f1a',border:'1px solid #00d4ff44',width:'100%',maxWidth:520,padding:28,clipPath:'polygon(14px 0%,100% 0%,100% calc(100% - 14px),calc(100% - 14px) 100%,0% 100%,0% 14px)',boxShadow:'0 24px 80px rgba(0,0,0,0.9)',position:'relative'}}>
              <div style={{position:'absolute',top:0,left:0,width:14,height:14,borderTop:'2px solid #00d4ff',borderLeft:'2px solid #00d4ff'}}/>
              <div style={{position:'absolute',top:0,left:14,right:0,height:1,background:'linear-gradient(to right,#00d4ff,transparent)'}}/>

              <SectionHeader accent="#00d4ff" style={{marginBottom:16}}>
                {scError ? 'Import Failed' : 'SC Log Import Results'}
              </SectionHeader>

              {scError && (
                <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.3)',padding:'12px 14px',fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#fca5a5',lineHeight:1.6,marginBottom:16}}>
                  {scError}
                </div>
              )}

              {scResult && (
                <>
                  {/* Stats */}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                    {[
                      ['SESSIONS FOUND',  scResult.sessionCount,             '#00d4ff'],
                      ['TOTAL PLAYTIME',  `${Math.floor(scResult.totalMins/60)}h ${scResult.totalMins%60}m`, '#00e5a0'],
                      ['FILES SCANNED',   scResult.filesScanned,             '#a855f7'],
                    ].map(([label,value,color])=>(
                      <div key={label} style={{padding:'10px 12px',background:'#060e18',border:`1px solid ${color}33`,textAlign:'center'}}>
                        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:20,fontWeight:700,color}}>{value}</div>
                        <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:8,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:C.textDim,marginTop:2}}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Session preview list */}
                  {scResult.sessions.length > 0 && (
                    <>
                      <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:9,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',color:C.textDim,marginBottom:6}}>
                        SESSION PREVIEW (most recent first)
                      </div>
                      <div style={{maxHeight:200,overflowY:'auto',display:'flex',flexDirection:'column',gap:3,marginBottom:16}}>
                        {[...scResult.sessions].reverse().slice(0,15).map((s,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',background:'#060e18',border:`1px solid ${C.border}`}}>
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <div style={{width:5,height:5,background:'#00d4ff',boxShadow:'0 0 5px #00d4ff'}}/>
                              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:C.text}}>
                                {new Date(s.startedAt).toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric',year:'2-digit'})}
                              </span>
                            </div>
                            <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#00d4ff'}}>
                              {Math.floor(s.duration/60)}h {s.duration%60}m
                            </span>
                          </div>
                        ))}
                        {scResult.sessions.length > 15 && (
                          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:C.textDim,textAlign:'center',padding:'4px 0'}}>
                            +{scResult.sessions.length-15} more sessions
                          </div>
                        )}
                      </div>

                      {/* Warning about existing data */}
                      <div style={{background:'#f59e0b0a',border:'1px solid #f59e0b33',padding:'10px 12px',fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#fde68a',marginBottom:14,lineHeight:1.6}}>
                        ⚠ This will REPLACE all existing session data and playtime for Star Citizen with data from {scResult.sessionCount} log files. Current playtime: {formatTime(game.playtime)}.
                      </div>
                    </>
                  )}

                  {scResult.sessions.length === 0 && (
                    <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:C.textDim,textAlign:'center',padding:'20px 0',marginBottom:16}}>
                      No valid sessions found in these logs.
                    </div>
                  )}
                </>
              )}

              <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
                <RsiButton onClick={()=>{setScResult(null);setScError(null)}} variant="ghost" size="sm">CANCEL</RsiButton>
                {scResult?.sessions.length > 0 && (
                  <RsiButton variant="solid" size="sm" accent="#00d4ff" onClick={()=>{
                    // Apply: replace sessions and recalculate playtime
                    const newSessions = scResult.sessions.map(s=>({ date: s.date, duration: s.duration }))
                    const newPlaytime = scResult.totalMins
                    const lastSession = [...scResult.sessions].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt))[0]
                    onUpdateNotes && onUpdateNotes(game.id, game.notes) // trigger save
                    // Use onSaveScreenshots as a vehicle to save session data (reuse existing channel)
                    onApplyScLogs?.({ sessions: newSessions, playtime: newPlaytime, lastPlayed: lastSession?.endedAt || lastSession?.startedAt })
                    setScResult(null); setScError(null)
                  }}>
                    APPLY {scResult.sessionCount} SESSION{scResult.sessionCount!==1?'S':''}
                  </RsiButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
