import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PlatformBadge, StatusBadge } from '../components/ui/Badges'
import Icon from '../components/ui/Icon'
import { PLATFORM_META, STATUS_META } from '../data/constants'
import { C, Panel, SectionHeader, DataReadout, RsiButton, RsiProgress, HexBadge } from '../components/ui/RSI'
import { formatTime, timeAgo } from '../components/library/GameCard'
import { useSteamFriends } from '../hooks/useSteamFriends'

const MiniTooltip = ({ active, payload }) => {
  if (active && payload?.length && payload[0].value > 0) return (
    <div style={{ background: C.surface2, border: `1px solid ${C.borderBright}`, padding: '5px 10px', fontSize: 11, fontFamily: "'Share Tech Mono',monospace", color: C.accent }}>
      {payload[0].payload.label} · {formatTime(payload[0].value)}
    </div>
  )
  return null
}

function HeroCard({ game, onSelect, accent, launcher }) {
  if (!game) return (
    <Panel style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }} clip>
      <Icon name="gamepad" size={40} color={C.textDim} />
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: C.textDim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No Recent Activity</div>
    </Panel>
  )

  const isRunning = launcher?.isRunning(game.id)

  return (
    <div onClick={() => onSelect(game)} style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', height: 220, clipPath: 'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)', background: C.surface }}>
      {/* Background art */}
      <img src={game.backgroundUrl || game.coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, filter: 'blur(2px) saturate(0.7)', transform: 'scale(1.05)' }} onError={e => e.target.style.display = 'none'} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(6,10,16,0.88) 0%, rgba(6,10,16,0.4) 100%)' }} />

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.015) 3px,rgba(0,212,255,0.015) 4px)', pointerEvents: 'none' }} />

      {/* Corner accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: `2px solid ${accent}`, borderLeft: `2px solid ${accent}` }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: `2px solid ${accent}`, borderRight: `2px solid ${accent}` }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: `1px solid ${accent}44`, borderRight: `1px solid ${accent}44` }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: `1px solid ${accent}44`, borderLeft: `1px solid ${accent}44` }} />

      {/* Border */}
      <div style={{ position: 'absolute', inset: 0, border: `1px solid ${accent}33`, clipPath: 'polygon(16px 0%,100% 0%,100% calc(100% - 16px),calc(100% - 16px) 100%,0% 100%,0% 16px)', pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end', flex: 1 }}>
          <img src={game.coverUrl} alt="" style={{ width: 72, height: 100, objectFit: 'cover', flexShrink: 0, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', border: `1px solid ${accent}44`, boxShadow: `0 4px 20px rgba(0,0,0,0.8), 0 0 20px ${accent}22` }} onError={e => e.target.style.display = 'none'} />
          <div style={{ flex: 1, paddingBottom: 2 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, background: accent, boxShadow: `0 0 6px ${accent}` }} />
              CONTINUE PLAYING
            </div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.1, textShadow: `0 2px 20px rgba(0,0,0,0.8)` }}>{game.title}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <PlatformBadge platform={game.platform} />
              <StatusBadge status={game.status} />
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim }}>{formatTime(game.playtime)}</span>
              <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim + '88' }}>{timeAgo(game.lastPlayed)}</span>
            </div>
          </div>
          {isRunning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5a0', boxShadow: '0 0 10px #00e5a0', animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, color: '#00e5a0', letterSpacing: '0.1em' }}>RUNNING</span>
            </div>
          ) : (
            <RsiButton onClick={e => { e.stopPropagation(); onSelect(game) }} variant="solid" size="md" accent={accent} style={{ flexShrink: 0 }}>
              <Icon name="play" size={14} color="#080c12" />
              LAUNCH
            </RsiButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HomePage({ games, onSelect, accent = C.accent, launcher }) {
  const { friends, loading: friendsLoading, error: friendsError, steamConnected, lastFetched, refetch } = useSteamFriends()
  const recentlyPlayed = [...games].filter(g => g.lastPlayed).sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
  const hero = recentlyPlayed[0]
  const recentlyAdded = [...games].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 8)
  const totalMins = games.reduce((s, g) => s + g.playtime, 0)
  const playing = games.filter(g => g.status === 'playing').length
  const completed = games.filter(g => g.status === 'completed').length
  const backlog = games.filter(g => g.status === 'backlog').length

  const weekActivity = useMemo(() => {
    const map = {}
    games.forEach(g => (g.sessions || []).forEach(s => { map[s.date] = (map[s.date] || 0) + s.duration }))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000)
      const key = d.toISOString().split('T')[0]
      return { label: d.toLocaleDateString('en', { weekday: 'short' }).toUpperCase(), value: map[key] || 0 }
    })
  }, [games])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      style={{ padding: 20, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div style={{ flexShrink: 0 }}><HeroCard game={hero} onSelect={onSelect} accent={accent} launcher={launcher} /></div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, flexShrink: 0 }}>
        {[
          { label: 'TOTAL GAMES',   value: games.length,         color: accent },
          { label: 'TOTAL PLAYTIME', value: formatTime(totalMins), color: '#00e5a0' },
          { label: 'NOW PLAYING',   value: playing,               color: '#f59e0b' },
          { label: 'COMPLETED',     value: completed,             color: '#a855f7' },
        ].map(({ label, value, color }) => (
          <Panel key={label} style={{ padding: '14px 16px' }} glow={false}>
            <DataReadout label={label} value={value} accent={color} />
          </Panel>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 12, flexShrink: 0 }}>
        {/* Recently Added */}
        <div>
          <SectionHeader accent={accent}>Recently Added</SectionHeader>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {recentlyAdded.map(game => (
              <motion.div key={game.id} whileHover={{ y: -4 }} onClick={() => onSelect(game)}
                style={{ flexShrink: 0, width: 90, cursor: 'pointer' }}>
                <div style={{ clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', overflow: 'hidden', marginBottom: 6, background: C.surface2, aspectRatio: '2/3', border: `1px solid ${C.border}` }}>
                  <img src={game.coverUrl} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.title}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: C.textDim, marginTop: 1, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{PLATFORM_META[game.platform]?.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Weekly activity */}
        <Panel style={{ padding: '14px 14px 8px' }}>
          <SectionHeader accent={accent} style={{ marginBottom: 10 }}>This Week</SectionHeader>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={weekActivity} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Tooltip content={<MiniTooltip />} cursor={{ fill: `${accent}08` }} />
              <Bar dataKey="value" fill={accent} radius={[1, 1, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {weekActivity.map(d => (
              <div key={d.label} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: C.textDim, flex: 1, textAlign: 'center' }}>{d.label}</div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Bottom two-col: fills remaining height, both columns scroll independently */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Left - Recent sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <SectionHeader accent={accent}>Recent Sessions</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {recentlyPlayed.length === 0 ? (
              <div style={{ padding: '20px 14px', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim, textAlign: 'center', background: C.surface, border: `1px solid ${C.border}`, clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }}>
                NO SESSIONS YET - LAUNCH A GAME TO START TRACKING
              </div>
            ) : recentlyPlayed.slice(0, 5).map(game => (
              <motion.div key={game.id} whileHover={{ x: 4 }} onClick={() => onSelect(game)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 14px', background: C.surface, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-color 0.15s', clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = accent + '33'}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <img src={game.coverUrl} alt={game.title} style={{ width: 36, height: 50, objectFit: 'cover', background: C.surface2, flexShrink: 0, clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)' }} onError={e => e.target.style.display = 'none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.title}</div>
                  <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginTop: 2 }}>{formatTime(game.playtime)} · {timeAgo(game.lastPlayed)}</div>
                </div>
                <PlatformBadge platform={game.platform} small />
                <HexBadge color={STATUS_META[game.status]?.color || C.textDim}>{STATUS_META[game.status]?.label}</HexBadge>
                <div style={{ width: 28, height: 28, background: `${accent}15`, border: `1px solid ${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 6px)' }}>
                  <Icon name="play" size={12} color={accent} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right - Steam friends feed */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <SectionHeader accent={accent} style={{ marginBottom: 0 }}>
              {steamConnected ? 'Steam Friends' : 'Activity'}
            </SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {steamConnected && lastFetched && (
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim }}>
                  {timeAgo(new Date(lastFetched).toISOString())}
                </span>
              )}
              {steamConnected && (
                <button onClick={refetch} title="Refresh"
                  style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textDim, cursor: 'pointer', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim }}>
                  <Icon name="refresh" size={11} color="currentColor" />
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 2 }}>
            {/* Loading skeleton */}
            {friendsLoading && friends.length === 0 && [0,1,2].map(i => (
              <div key={'sk'+i} style={{ padding: '8px 10px', background: C.surface, border: `1px solid ${C.border}`, clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, background: `${accent}10`, flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, width: '55%', background: `${accent}10`, marginBottom: 5, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 6, width: '75%', background: C.border, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}

            {/* Not connected */}
            {!friendsLoading && !steamConnected && friends.length === 0 && (
              <div style={{ padding: '14px 12px', background: C.surface, border: `1px solid ${C.border}`, clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: C.textDim, letterSpacing: '0.08em', marginBottom: 4 }}>CONNECT STEAM TO SEE FRIENDS</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.border }}>Platforms → Steam</div>
              </div>
            )}

            {/* Error */}
            {friendsError && !friendsLoading && (
              <div style={{ padding: '8px 10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)' }}>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: '#fca5a5', lineHeight: 1.5 }}>
                  {friendsError.includes('private') ? '🔒 Friend list is private on Steam' : friendsError}
                </div>
              </div>
            )}

            {/* Real Steam friends */}
            {friends.slice(0, 20).map((f, i) => {
              const isOnline  = f.personastate > 0
              const dotColor  = f.isInGame ? '#00e5a0' : isOnline ? (f.color || accent) : C.border
              const border    = f.isInGame ? '#00e5a033' : C.border
              const minsAgo   = f.lastOnline ? Math.round((Date.now() - f.lastOnline) / 60000) : null
              const timeText  = minsAgo == null ? '' : minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`
              return (
                <motion.div key={f.steamid} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ padding: '7px 10px', background: C.surface, border: `1px solid ${border}`, clipPath: 'polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)', position: 'relative', overflow: 'hidden' }}>
                  {f.isInGame && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(to right, transparent, #00e5a044, transparent)' }} />}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {f.avatar
                        ? <img src={f.avatar} alt={f.name} style={{ width: 28, height: 28, objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
                        : <div style={{ width: 28, height: 28, background: `${f.color || accent}18`, border: `1px solid ${f.color || accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: f.color || accent }}>
                            {f.avatarInitial || f.name?.slice(0,1).toUpperCase() || '?'}
                          </div>
                      }
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, background: dotColor, borderRadius: '50%', border: '1px solid #080c12', boxShadow: f.isInGame ? '0 0 5px #00e5a0' : 'none' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isOnline ? C.textBright : C.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{f.name}</span>
                        {f.isInGame && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: '#00e5a0', background: '#00e5a010', border: '1px solid #00e5a030', padding: '1px 5px', flexShrink: 0 }}>IN-GAME</span>}
                      </div>
                      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.action}{timeText ? ` · ${timeText}` : ''}
                      </div>
                    </div>
                    {f.gameImgUrl && (
                      <img src={f.gameImgUrl} alt="" style={{ width: 20, height: 28, objectFit: 'cover', flexShrink: 0, opacity: 0.75, borderRadius: 1 }} onError={e => e.target.style.display = 'none'} />
                    )}
                  </div>
                </motion.div>
              )
            })}

            {/* Footer */}
            {friends.length > 0 && (
              <div style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim }}>
                  {friends.filter(f => f.isInGame).length} IN-GAME · {friends.filter(f => f.personastate > 0).length} ONLINE · {friends.length} TOTAL
                </span>
                {friends.length > 7 && (
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.textDim }}>+{friends.length - 7} more</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}