import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, DataReadout, HexBadge, RsiProgress } from '../components/ui/RSI'
import { PLATFORM_META, STATUS_META } from '../data/constants'

function formatTime(mins) {
  if (!mins) return '0h'
  const h = Math.floor(mins / 60), m = mins % 60
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
}

const CHART_COLORS = ['#00d4ff','#00e5a0','#f59e0b','#a855f7','#ef4444','#0a84ff','#f97316']

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#060e18', border: `1px solid ${C.borderBright}`, padding: '7px 12px', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.accent }}>
      {label && <div style={{ color: C.textDim, marginBottom: 3 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || C.accent }}>{p.name ? `${p.name}: ` : ''}{p.value}</div>
      ))}
    </div>
  )
}

export default function StatsPage({ games, accent = C.accent }) {
  const stats = useMemo(() => {
    const totalMins = games.reduce((s, g) => s + (g.playtime || 0), 0)
    const played = games.filter(g => g.playtime > 0)
    const avgHours = played.length ? (totalMins / played.length / 60).toFixed(1) : 0
    const mostPlayed = [...games].sort((a, b) => b.playtime - a.playtime).slice(0, 5)

    const platformMap = {}
    games.forEach(g => {
      if (!platformMap[g.platform]) platformMap[g.platform] = { hours: 0, count: 0 }
      platformMap[g.platform].hours += (g.playtime || 0) / 60
      platformMap[g.platform].count++
    })
    const platformData = Object.entries(platformMap)
      .map(([k, v]) => ({ name: PLATFORM_META[k]?.label || k, hours: Math.round(v.hours * 10) / 10, count: v.count }))
      .sort((a, b) => b.hours - a.hours)

    const statusMap = {}
    games.forEach(g => { statusMap[g.status] = (statusMap[g.status] || 0) + 1 })
    const statusData = Object.entries(statusMap).map(([k, v]) => ({
      name: STATUS_META[k]?.label || k, value: v, color: STATUS_META[k]?.color || '#4a6a85',
    }))

    const genreMap = {}
    games.forEach(g => (g.genre || []).forEach(genre => { genreMap[genre] = (genreMap[genre] || 0) + 1 }))
    const genreData = Object.entries(genreMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))

    const activityMap = {}
    games.forEach(g => (g.sessions || []).forEach(s => {
      const d = s.date?.split('T')[0] || s.date
      activityMap[d] = (activityMap[d] || 0) + (s.duration / 60)
    }))
    const activityData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (29 - i) * 86400000)
      const key = d.toISOString().split('T')[0]
      return { date: key, label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), hours: Math.round((activityMap[key] || 0) * 10) / 10 }
    })

    // Gaming streak: count consecutive days with sessions
    const sessionDays = new Set()
    games.forEach(g => (g.sessions || []).forEach(s => sessionDays.add(s.date?.split('T')[0] || s.date)))
    let streak = 0, bestStreak = 0, cur = 0
    for (let i = 0; i < 90; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      if (sessionDays.has(d)) { cur++; if (i === 0 || i === streak) streak = cur }
      else { bestStreak = Math.max(bestStreak, cur); cur = 0; if (i > 0 && streak === i) streak = 0 }
    }
    bestStreak = Math.max(bestStreak, cur)
    const currentStreak = streak

    // Day of week breakdown
    const dowMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    games.forEach(g => (g.sessions || []).forEach(s => {
      const day = new Date(s.date).getDay()
      if (!isNaN(day)) dowMap[day] = (dowMap[day] || 0) + (s.duration / 60)
    }))
    const dowData = DOW_LABELS.map((label, i) => ({ label, hours: Math.round((dowMap[i] || 0) * 10) / 10 }))

    // Best gaming day
    const bestDow = dowData.reduce((best, d) => d.hours > best.hours ? d : best, { label: '-', hours: 0 })

    return { totalMins, totalHours: (totalMins / 60).toFixed(1), avgHours, played, mostPlayed, platformData, statusData, genreData, activityData, currentStreak, bestStreak, dowData, bestDow }
  }, [games])

  const statCards = [
    { label: 'TOTAL GAMES',    value: games.length,                color: accent         },
    { label: 'TOTAL PLAYTIME', value: formatTime(stats.totalMins), color: C.success      },
    { label: 'GAMES PLAYED',   value: stats.played.length,         color: '#f59e0b'      },
    { label: 'AVG PER GAME',   value: `${stats.avgHours}h`,        color: '#a855f7'      },
    { label: 'CURRENT STREAK', value: `${stats.currentStreak}d`,   color: '#f43f5e'      },
    { label: 'BEST STREAK',    value: `${stats.bestStreak}d`,      color: '#f97316'      },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
      style={{ padding: 20, overflow: 'auto', height: '100%' }}>

      <SectionHeader accent={accent} style={{ marginBottom: 18 }}>Statistics</SectionHeader>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {statCards.map(({ label, value, color }) => (
          <Panel key={label} style={{ padding: '14px 16px' }}>
            <DataReadout label={label} value={value} accent={color} />
          </Panel>
        ))}
      </div>

      {/* Activity chart */}
      <Panel style={{ padding: '16px 16px 10px', marginBottom: 16 }}>
        <SectionHeader accent={accent} style={{ marginBottom: 12 }}>Activity - Last 30 Days</SectionHeader>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={stats.activityData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={accent} stopOpacity={0.3} />
                <stop offset="95%" stopColor={accent} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: C.textDim, fontFamily: "'Share Tech Mono',monospace" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: C.textDim }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${v}h` : ''} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: `${accent}22`, strokeWidth: 1 }} />
            <Area type="monotone" dataKey="hours" name="Hours" stroke={accent} strokeWidth={1.5} fill="url(#aGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Platform breakdown */}
        <Panel style={{ padding: '16px 16px 10px' }}>
          <SectionHeader accent={accent} style={{ marginBottom: 12 }}>By Platform</SectionHeader>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.platformData} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: C.textDim, fontFamily: "'Share Tech Mono',monospace" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}h`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: C.text, fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }} tickLine={false} axisLine={false} width={72} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${accent}08` }} />
              <Bar dataKey="hours" name="Hours" fill={accent} radius={[0, 2, 2, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Status pie */}
        <Panel style={{ padding: '16px 16px 10px' }}>
          <SectionHeader accent={accent} style={{ marginBottom: 12 }}>By Status</SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ResponsiveContainer width="50%" height={150}>
              <PieChart>
                <Pie data={stats.statusData} cx="50%" cy="50%" innerRadius={42} outerRadius={66} dataKey="value" paddingAngle={2}>
                  {stats.statusData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {stats.statusData.map(({ name, value, color }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, background: color, boxShadow: `0 0 4px ${color}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textDim }}>{name}</span>
                  </div>
                  <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: C.text }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Day of week + best day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 12, marginBottom: 12 }}>
        <Panel style={{ padding: '16px 16px 10px' }}>
          <SectionHeader accent={accent} style={{ marginBottom: 12 }}>Gaming by Day of Week</SectionHeader>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={stats.dowData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: C.textDim, fontFamily: "'Share Tech Mono',monospace" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.textDim }} tickLine={false} axisLine={false} tickFormatter={v => v > 0 ? `${v}h` : ''} />
              <Tooltip content={<ChartTip />} cursor={{ fill: `${accent}08` }} />
              <Bar dataKey="hours" name="Hours" fill={accent} radius={[2, 2, 0, 0]} opacity={0.85}
                label={false}
                isAnimationActive={true}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div>
            <DataReadout label="BEST DAY" value={stats.bestDow.label} accent={accent} />
          </div>
          <div>
            <DataReadout label="CURRENT STREAK" value={`${stats.currentStreak} DAYS`} accent='#f43f5e' />
          </div>
          <div>
            <DataReadout label="BEST STREAK" value={`${stats.bestStreak} DAYS`} accent='#f97316' />
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Most played */}
        <Panel style={{ padding: 16 }}>
          <SectionHeader accent={accent} style={{ marginBottom: 12 }}>Most Played</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.mostPlayed.map((g, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: i === 0 ? '#f59e0b' : C.textDim, width: 16, textAlign: 'center', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                <img src={g.coverUrl} alt="" style={{ width: 28, height: 40, objectFit: 'cover', flexShrink: 0, clipPath: 'polygon(2px 0%,100% 0%,100% calc(100% - 2px),calc(100% - 2px) 100%,0% 100%,0% 2px)' }} onError={e => e.target.style.display = 'none'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.textBright, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{g.title}</div>
                  <div style={{ height: 3, background: C.border, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (g.playtime / (stats.mostPlayed[0]?.playtime || 1)) * 100)}%`, height: '100%', background: accent, boxShadow: `0 0 6px ${accent}` }} />
                  </div>
                </div>
                <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: accent, flexShrink: 0 }}>{formatTime(g.playtime)}</span>
              </div>
            ))}
            {stats.mostPlayed.length === 0 && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim, textAlign: 'center', padding: '16px 0' }}>NO DATA</div>}
          </div>
        </Panel>

        {/* Top genres */}
        <Panel style={{ padding: 16 }}>
          <SectionHeader accent={accent} style={{ marginBottom: 12 }}>Top Genres</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {stats.genreData.map(({ name, count }, i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: C.text }}>{name}</span>
                    <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim }}>{count}</span>
                  </div>
                  <div style={{ height: 3, background: C.border, overflow: 'hidden' }}>
                    <div style={{ width: `${(count / (stats.genreData[0]?.count || 1)) * 100}%`, height: '100%', background: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}` }} />
                  </div>
                </div>
              </div>
            ))}
            {stats.genreData.length === 0 && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim, textAlign: 'center', padding: '16px 0' }}>NO DATA</div>}
          </div>
        </Panel>
      </div>
    </motion.div>
  )
}
