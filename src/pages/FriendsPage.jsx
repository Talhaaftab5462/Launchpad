import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, HexBadge, RsiButton, RsiSpinner } from '../components/ui/RSI'
import { useSteamFriends } from '../hooks/useSteamFriends'

const STATUS_COLORS = {
  playing: '#00e5a0',
  online:  '#3b82f6',
  away:    '#f59e0b',
  offline: '#4a6a85',
}

function statusOf(f) {
  if (f.isInGame)         return 'playing'
  if (f.personastate > 0) return 'online'
  return 'offline'
}

function timeAgo(ms) {
  if (!ms) return ''
  const m = Math.round((Date.now() - ms) / 60000)
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m/60)}h ago`
  return `${Math.floor(m/1440)}d ago`
}

function FriendCard({ f, accent }) {
  const [expanded, setExpanded] = useState(false)
  const status     = statusOf(f)
  const statusColor = STATUS_COLORS[status]

  return (
    <motion.div layout initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
      style={{ background: C.surface, border:`1px solid ${f.isInGame ? statusColor+'33' : C.border}`, clipPath:'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)', overflow:'hidden', transition:'border-color 0.2s', position:'relative' }}>

      {/* Playing top-glow */}
      {f.isInGame && <div style={{ height:1, background:`linear-gradient(to right,transparent,${statusColor}66,transparent)` }} />}

      <div onClick={() => setExpanded(e => !e)}
        style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', cursor:'pointer' }}>

        {/* Avatar */}
        <div style={{ position:'relative', flexShrink:0 }}>
          {f.avatar
            ? <img src={f.avatar} alt={f.name} style={{ width:40, height:40, objectFit:'cover', display:'block' }} onError={e=>e.target.style.display='none'} />
            : <div style={{ width:40, height:40, background:`${f.color || statusColor}18`, border:`1px solid ${f.color || statusColor}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:f.color || statusColor }}>
                {f.avatarInitial || f.name?.slice(0,1).toUpperCase() || '?'}
              </div>
          }
          {/* Status dot */}
          <div style={{ position:'absolute', bottom:-1, right:-1, width:10, height:10, borderRadius:'50%', background:statusColor, border:'2px solid #080c12', boxShadow: f.isInGame ? `0 0 8px ${statusColor}` : 'none' }} />
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
            <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'0.04em', color: status !== 'offline' ? C.textBright : C.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
            {f.isInGame && <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.1em', color:'#00e5a0', background:'#00e5a010', border:'1px solid #00e5a030', padding:'1px 6px', flexShrink:0 }}>IN-GAME</span>}
            {!f.isInGame && status === 'online' && <HexBadge color={accent} style={{ fontSize:8 }}>ONLINE</HexBadge>}
            {status === 'offline' && <HexBadge color={C.textDim} style={{ fontSize:8 }}>OFFLINE</HexBadge>}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {f.action}
            {f.lastOnline && !f.isInGame ? ` · ${timeAgo(f.lastOnline)}` : ''}
          </div>
        </div>

        {/* Game cover */}
        {f.gameImgUrl && (
          <img src={f.gameImgUrl} alt="" style={{ width:28, height:40, objectFit:'cover', flexShrink:0, opacity:0.85 }} onError={e=>e.target.style.display='none'} />
        )}

        {/* Expand chevron */}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration:0.18 }} style={{ flexShrink:0 }}>
          <Icon name="chevronDown" size={14} color={C.textDim} />
        </motion.div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}>
            <div style={{ padding:'0 14px 14px', borderTop:`1px solid ${C.border}` }}>
              <div style={{ paddingTop:12, display:'flex', gap:16, flexWrap:'wrap' }}>
                {f.gameName && (
                  <div>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, marginBottom:3 }}>
                      {f.isInGame ? 'Currently Playing' : 'Last Played'}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:f.isInGame ? '#00e5a0' : C.text }}>{f.gameName}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, marginBottom:3 }}>Status</div>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:statusColor, textTransform:'uppercase' }}>{status}</div>
                </div>
                {f.profileUrl && (
                  <div style={{ marginLeft:'auto' }}>
                    <a href={f.profileUrl} target="_blank" rel="noreferrer"
                      style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:accent, textDecoration:'none', border:`1px solid ${accent}33`, padding:'4px 10px', display:'inline-block', transition:'border-color 0.15s' }}>
                      VIEW PROFILE ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FriendsPage({ accent = C.accent }) {
  const { friends, loading, error, steamConnected, lastFetched, refetch } = useSteamFriends()
  const [filter, setFilter] = useState('all') // 'all' | 'playing' | 'online' | 'offline'

  const counts = {
    all:     friends.length,
    playing: friends.filter(f => f.isInGame).length,
    online:  friends.filter(f => f.personastate > 0 && !f.isInGame).length,
    offline: friends.filter(f => f.personastate === 0).length,
  }

  const filtered = friends.filter(f => {
    if (filter === 'playing') return f.isInGame
    if (filter === 'online')  return f.personastate > 0 && !f.isInGame
    if (filter === 'offline') return f.personastate === 0
    return true
  })

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.2 }}
      style={{ padding:20, overflow:'auto', height:'100%' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <SectionHeader accent={accent}>Steam Friends</SectionHeader>
          {lastFetched && (
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:C.textDim, marginTop:2, letterSpacing:'0.06em' }}>
              UPDATED {new Date(lastFetched).toLocaleTimeString()}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {!steamConnected && !loading && (
            <HexBadge color="#f59e0b">CONNECT STEAM IN PLATFORMS</HexBadge>
          )}
          <RsiButton onClick={refetch} variant="ghost" size="sm" accent={accent} disabled={loading}>
            {loading ? <RsiSpinner size={12} accent={accent} /> : <Icon name="refresh" size={12} color={accent} />}
            {loading ? 'REFRESHING' : 'REFRESH'}
          </RsiButton>
        </div>
      </div>

      {/* Stats row */}
      {friends.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[
            { key:'all',     label:'ALL FRIENDS', value:counts.all,     color:C.textDim  },
            { key:'playing', label:'IN-GAME',      value:counts.playing, color:'#00e5a0'  },
            { key:'online',  label:'ONLINE',       value:counts.online,  color:accent     },
            { key:'offline', label:'OFFLINE',      value:counts.offline, color:C.textDim  },
          ].map(({ key, label, value, color }) => (
            <div key={key} onClick={() => setFilter(key)}
              style={{ padding:'12px 14px', background:filter===key?`${color}0e`:C.surface, border:`1px solid ${filter===key?color+'44':C.border}`, cursor:'pointer', transition:'all 0.15s', clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color: filter===key ? color : C.textDim }}>{value}</div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.textDim, marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'#fca5a5', marginBottom:12, lineHeight:1.6 }}>
          {error.includes('private') ? '🔒 Your Steam friend list is set to Private. Change it in Steam → Privacy Settings → Friends List → Public.' : error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && friends.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ height:62, background:C.surface, border:`1px solid ${C.border}`, clipPath:'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)', display:'flex', alignItems:'center', gap:12, padding:'0 14px' }}>
              <div style={{ width:40, height:40, background:`${accent}10`, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ height:10, width:'40%', background:`${accent}10`, marginBottom:6 }} />
                <div style={{ height:8, width:'60%', background:C.border }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Not connected state */}
      {!loading && !steamConnected && friends.length === 0 && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 0', gap:16 }}>
          <div style={{ width:64, height:64, background:`${accent}12`, border:`1px solid ${accent}28`, display:'flex', alignItems:'center', justifyContent:'center', clipPath:'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)' }}>
            <Icon name="users" size={28} color={accent} />
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:C.textDim, marginBottom:6 }}>Steam Not Connected</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.border, lineHeight:1.6 }}>Connect your Steam account in Platforms → Steam to see your friends here.</div>
          </div>
        </div>
      )}

      {/* Empty filtered state */}
      {!loading && steamConnected && filtered.length === 0 && friends.length > 0 && (
        <div style={{ textAlign:'center', padding:'40px 0', fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:C.textDim }}>
          NO {filter.toUpperCase()} FRIENDS RIGHT NOW
        </div>
      )}

      {/* Friends list */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map((f, i) => (
          <FriendCard key={f.steamid || f.steamId || i} f={f} accent={accent} />
        ))}
      </div>
    </motion.div>
  )
}
