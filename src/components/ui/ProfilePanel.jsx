import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from './Icon'
import { C, SectionHeader, HexBadge, RsiButton, RsiProgress, PlatformSVG } from './RSI'
import { PLATFORM_META, STATUS_META } from '../../data/constants'

function formatTime(mins) {
  if (!mins) return '0h'
  const h = Math.floor(mins / 60), m = mins % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

function timeAgo(iso) {
  if (!iso) return 'Never'
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30)  return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function EditField({ label, value, onChange, placeholder, multiline = false, accent }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const INP = { background: '#060e18', border: `1px solid ${accent}44`, color: C.textBright, outline: 'none', fontFamily: 'inherit', fontSize: 13, padding: '6px 10px', width: '100%', resize: multiline ? 'vertical' : 'none' }
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim }}>{label}</span>
        {!editing
          ? <button onClick={() => { setDraft(value); setEditing(true) }} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }} onMouseEnter={e => e.currentTarget.style.color = accent} onMouseLeave={e => e.currentTarget.style.color = C.textDim}>EDIT</button>
          : <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>CANCEL</button>
              <button onClick={() => { onChange(draft); setEditing(false) }} style={{ background: `${accent}22`, border: `1px solid ${accent}44`, color: accent, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>SAVE</button>
            </div>
        }
      </div>
      {editing
        ? multiline
          ? <textarea autoFocus rows={3} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }} style={INP} />
          : <input autoFocus type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { onChange(draft); setEditing(false) } if (e.key === 'Escape') setEditing(false) }} style={INP} />
        : <div style={{ fontSize: 13, color: value ? C.textBright : C.textDim, minHeight: 22, padding: '4px 0', borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 }}>{value || placeholder}</div>
      }
    </div>
  )
}

function GamerCard({ profile, games, platformProfiles, accent }) {
  const totalHours   = Math.floor(games.reduce((s, g) => s + (g.playtime || 0), 0) / 60)
  const topGame      = [...games].sort((a, b) => b.playtime - a.playtime)[0]
  const completed    = games.filter(g => g.status === 'completed').length
  const platforms    = [...new Set(games.map(g => g.platform))].slice(0, 6)
  const initials     = profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'LP'

  return (
    <div style={{ background: 'linear-gradient(135deg, #060d18 0%, #0a1628 100%)', border: `1px solid ${accent}44`, clipPath: 'polygon(14px 0%,100% 0%,100% calc(100% - 14px),calc(100% - 14px) 100%,0% 100%,0% 14px)', padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.008) 3px,rgba(0,212,255,0.008) 4px)', pointerEvents: 'none' }} />
      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 14, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderBottom: `2px solid ${accent}44`, borderRight: `2px solid ${accent}44` }} />
      <div style={{ position: 'absolute', top: 0, left: 14, right: 0, height: 1, background: `linear-gradient(to right, ${accent}88, transparent)` }} />

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative' }}>
        {/* Avatar */}
        {profile.avatarUrl
          ? <img src={profile.avatarUrl} alt="" style={{ width: 52, height: 52, objectFit: 'cover', flexShrink: 0, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', border: `1px solid ${accent}44` }} onError={e => e.target.style.display = 'none'} />
          : <div style={{ width: 52, height: 52, background: `${accent}18`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani',sans-serif", fontSize: 20, fontWeight: 700, color: accent, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', flexShrink: 0 }}>{initials}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textBright, lineHeight: 1 }}>{profile.displayName || 'LAUNCHPAD USER'}</div>
          {profile.bio && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginTop: 4, lineHeight: 1.5 }}>{profile.bio}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {platforms.map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `${PLATFORM_META[p]?.accent || accent}15`, border: `1px solid ${PLATFORM_META[p]?.accent || accent}33`, padding: '2px 7px' }}>
                <PlatformSVG platform={p} size={10} color={PLATFORM_META[p]?.accent || accent} />
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: PLATFORM_META[p]?.accent || accent }}>{PLATFORM_META[p]?.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
        {[
          { label: 'GAMES',     value: games.length,   color: accent      },
          { label: 'PLAYTIME',  value: `${totalHours}h`, color: '#00e5a0' },
          { label: 'COMPLETED', value: completed,       color: '#a855f7'  },
          { label: 'PLATFORMS', value: platforms.length, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: `${color}08`, border: `1px solid ${color}22` }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', color: C.textDim, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Top game */}
      {topGame && topGame.playtime > 0 && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#04080e', border: `1px solid ${C.border}` }}>
          <img src={topGame.coverUrl} alt="" style={{ width: 20, height: 28, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: C.textDim, textTransform: 'uppercase' }}>Most Played</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topGame.title}</div>
          </div>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: accent, flexShrink: 0 }}>{formatTime(topGame.playtime)}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: C.textDim + '88', letterSpacing: '0.12em', textAlign: 'right' }}>LAUNCHPAD GAME LAUNCHER</div>
    </div>
  )
}

export default function ProfilePanel({ profile, onUpdate, games = [], platformProfiles = {}, onClose, accent = C.accent }) {
  const [tab, setTab] = useState('profile')

  const totalHours = Math.floor(games.reduce((s, g) => s + (g.playtime || 0), 0) / 60)
  const totalMins  = games.reduce((s, g) => s + (g.playtime || 0), 0) % 60
  const topGames   = [...games].sort((a, b) => b.playtime - a.playtime).slice(0, 5)
  const recentGame = [...games].filter(g => g.lastPlayed).sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))[0]
  const initials   = profile.displayName ? profile.displayName.slice(0, 2).toUpperCase() : 'LP'

  function exportCard() {
    const cardData = {
      displayName: profile.displayName,
      bio:         profile.bio,
      stats: { games: games.length, hours: totalHours, completed: games.filter(g => g.status === 'completed').length },
      topGame: topGames[0] ? { title: topGames[0].title, playtime: formatTime(topGames[0].playtime) } : null,
      platforms: [...new Set(games.map(g => g.platform))],
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(cardData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `${profile.displayName || 'launchpad'}-profile.json`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,14,0.85)', zIndex: 1200, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: '60px 20px 20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <motion.div initial={{ opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.2 }}
        style={{ width: 360, maxHeight: 'calc(100vh - 90px)', background: '#080f1a', border: `1px solid ${accent}44`, clipPath: 'polygon(12px 0%,100% 0%,100% calc(100% - 12px),calc(100% - 12px) 100%,0% 100%,0% 12px)', boxShadow: `0 24px 80px rgba(0,0,0,0.9), 0 0 40px ${accent}0a`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Corner accents */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
        <div style={{ position: 'absolute', top: 0, left: 12, right: 0, height: 1, background: `linear-gradient(to right, ${accent}, transparent)` }} />

        {/* Header */}
        <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="" style={{ width: 44, height: 44, objectFit: 'cover', clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', border: `1px solid ${accent}44` }} onError={e => e.target.style.display = 'none'} />
              : <div style={{ width: 44, height: 44, background: `${accent}18`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, color: accent, clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)' }}>{initials}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.displayName || 'Your Profile'}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: accent, marginTop: 2 }}>
              {games.length} GAMES · {totalHours}h {totalMins}m PLAYED
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', padding: 4, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = accent} onMouseLeave={e => e.currentTarget.style.color = C.textDim}>
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '12px 18px 0', gap: 0, flexShrink: 0 }}>
          {['profile', 'stats', 'card'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '7px 14px', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? accent : 'transparent'}`, color: tab === t ? accent : C.textDim, fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ height: 1, background: C.border, flexShrink: 0 }} />

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>

          {/* ── Profile tab ─────────────────────────────────────── */}
          {tab === 'profile' && (
            <div>
              <EditField label="Display Name" value={profile.displayName} onChange={v => onUpdate({ displayName: v })} placeholder="Enter your display name…" accent={accent} />
              <EditField label="Avatar URL" value={profile.avatarUrl} onChange={v => onUpdate({ avatarUrl: v })} placeholder="https://example.com/avatar.jpg" accent={accent} />
              <EditField label="Bio" value={profile.bio} onChange={v => onUpdate({ bio: v })} placeholder="Tell us about your gaming style…" multiline accent={accent} />

              {/* Connected platforms */}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textDim, marginBottom: 8 }}>Connected Platforms</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {Object.entries(platformProfiles).filter(([, p]) => p).map(([key, p]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: C.surface, border: `1px solid ${PLATFORM_META[key]?.accent || accent}33` }}>
                      <PlatformSVG platform={key} size={14} color={PLATFORM_META[key]?.accent || accent} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: PLATFORM_META[key]?.accent || accent }}>{PLATFORM_META[key]?.label}</div>
                        {p.name && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim }}>{p.name}</div>}
                      </div>
                      <HexBadge color="#00e5a0" style={{ fontSize: 8 }}>CONNECTED</HexBadge>
                    </div>
                  ))}
                  {Object.keys(platformProfiles).length === 0 && (
                    <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, textAlign: 'center', padding: '12px 0' }}>No platforms connected yet</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Stats tab ──────────────────────────────────────── */}
          {tab === 'stats' && (
            <div>
              <SectionHeader accent={accent} style={{ marginBottom: 12 }}>Gaming Summary</SectionHeader>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Total Games',    value: games.length,                                   color: accent       },
                  { label: 'Total Playtime', value: `${totalHours}h ${totalMins}m`,                 color: '#00e5a0'    },
                  { label: 'Completed',      value: games.filter(g => g.status === 'completed').length, color: '#a855f7'},
                  { label: 'Backlog',        value: games.filter(g => g.status === 'backlog').length,   color: '#f59e0b'},
                  { label: 'Avg Rating',     value: (() => { const r = games.filter(g => g.rating > 0); return r.length ? (r.reduce((s,g)=>s+g.rating,0)/r.length).toFixed(1) : '-' })(), color: '#f43f5e' },
                  { label: 'Last Played',    value: timeAgo(recentGame?.lastPlayed),                 color: C.textDim    },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '10px 12px', background: C.surface, border: `1px solid ${C.border}` }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textDim, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <SectionHeader accent={accent} style={{ marginBottom: 10 }}>Top Games</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topGames.filter(g => g.playtime > 0).map((g, i) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: i === 0 ? '#f59e0b' : C.textDim, width: 16, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                    <img src={g.coverUrl} alt="" style={{ width: 22, height: 30, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.title}</div>
                      <div style={{ height: 2, background: C.border, marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(g.playtime / (topGames[0]?.playtime || 1)) * 100}%`, height: '100%', background: accent }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: accent, flexShrink: 0 }}>{formatTime(g.playtime)}</span>
                  </div>
                ))}
                {topGames.filter(g => g.playtime > 0).length === 0 && (
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, textAlign: 'center', padding: '12px 0' }}>Start playing games to see stats</div>
                )}
              </div>

              {/* Status breakdown */}
              <SectionHeader accent={accent} style={{ marginTop: 16, marginBottom: 10 }}>Library Breakdown</SectionHeader>
              {Object.entries({ playing: 'Playing', completed: 'Completed', backlog: 'Backlog', dropped: 'Dropped', wishlist: 'Wishlist' }).map(([key, label]) => {
                const count = games.filter(g => g.status === key).length
                const pct   = games.length ? Math.round(count / games.length * 100) : 0
                if (count === 0) return null
                const color = { playing: '#00d4ff', completed: '#00e5a0', backlog: '#f59e0b', dropped: '#ef4444', wishlist: '#a855f7' }[key]
                return (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color }}>{label}</span>
                      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim }}>{count} · {pct}%</span>
                    </div>
                    <div style={{ height: 3, background: C.border, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, boxShadow: `0 0 6px ${color}` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Gamer Card tab ─────────────────────────────────── */}
          {tab === 'card' && (
            <div>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginBottom: 12, lineHeight: 1.6 }}>
                Your gamer card - exportable as JSON or screenshot it to share.
              </div>
              <GamerCard profile={profile} games={games} platformProfiles={platformProfiles} accent={accent} />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <RsiButton variant="primary" size="sm" accent={accent} onClick={exportCard} style={{ flex: 1, justifyContent: 'center' }}>
                  <Icon name="save" size={12} color={accent} /> EXPORT CARD
                </RsiButton>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
