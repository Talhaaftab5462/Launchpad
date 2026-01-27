import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameCardGrid, GameCardList } from '../components/library/GameCard'
import BulkActionsBar from '../components/library/BulkActionsBar'
import Icon from '../components/ui/Icon'
import { C, RsiButton, SectionHeader, HexBadge } from '../components/ui/RSI'
import { PLATFORM_META, STATUS_META } from '../data/constants'

const SEL_STYLE = {
  background: C.surface, border: `1px solid ${C.border}`, color: C.text,
  padding: '6px 10px', fontSize: 12, outline: 'none', cursor: 'pointer',
  fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
  appearance: 'none', clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)',
}

export default function LibraryPage({ games, onSelect, onToggleFav, onEdit, onDelete, onBulkDelete, onBulkStatus, onBulkFavorite, searchVal, onAdd, accent = C.accent, defaultView, density = 'comfortable', showAchBadges = true }) {
  const [view,           setView]    = useState(defaultView || 'grid')
  const [filterPlatform, setFP]      = useState('all')
  const [filterStatus,   setFS]      = useState('all')
  const [filterGenre,    setFG]      = useState('all')
  const [sortBy,         setSort]    = useState('lastPlayed')
  const [selectedIds,    setSelIds]  = useState(new Set())
  const [selecting,      setSelecting] = useState(false)
  const [showGenrePanel, setShowGenrePanel] = useState(false)

  // Collect all genres from library
  const allGenres = useMemo(() => {
    const genreSet = new Set()
    games.forEach(g => (g.genre || []).forEach(genre => genre && genreSet.add(genre)))
    return [...genreSet].sort()
  }, [games])

  const filtered = games.filter(g => {
    if (searchVal && !g.title.toLowerCase().includes(searchVal.toLowerCase()) &&
        !g.developer?.toLowerCase().includes(searchVal.toLowerCase()) &&
        !(g.genre || []).some(gen => gen.toLowerCase().includes(searchVal.toLowerCase()))) return false
    if (filterPlatform !== 'all' && g.platform !== filterPlatform) return false
    if (filterStatus   !== 'all' && g.status   !== filterStatus)   return false
    if (filterGenre    !== 'all' && !(g.genre || []).includes(filterGenre)) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'name')       return a.title.localeCompare(b.title)
    if (sortBy === 'playtime')   return b.playtime - a.playtime
    if (sortBy === 'lastPlayed') return (b.lastPlayed ? new Date(b.lastPlayed) : 0) - (a.lastPlayed ? new Date(a.lastPlayed) : 0)
    if (sortBy === 'dateAdded')  return new Date(b.dateAdded) - new Date(a.dateAdded)
    if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0)
    return 0
  })

  const toggleSelect  = useCallback((id) => {
    setSelIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])
  const selectAll      = () => setSelIds(new Set(filtered.map(g => g.id)))
  const clearSelection = () => { setSelIds(new Set()); setSelecting(false) }

  const activeFilters = [
    filterPlatform !== 'all' && { key: 'platform', label: PLATFORM_META[filterPlatform]?.label, onClear: () => setFP('all') },
    filterStatus   !== 'all' && { key: 'status',   label: STATUS_META[filterStatus]?.label,     onClear: () => setFS('all') },
    filterGenre    !== 'all' && { key: 'genre',    label: filterGenre,                           onClear: () => setFG('all') },
  ].filter(Boolean)

  const cardSize = density === 'compact' ? '128px' : '158px'
  const cardGap  = density === 'compact' ? 8 : 14

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
        <select style={SEL_STYLE} value={filterPlatform} onChange={e => setFP(e.target.value)}>
          <option value="all">All Platforms</option>
          {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k} style={{ background: '#0d1520' }}>{v.label}</option>)}
        </select>

        <select style={SEL_STYLE} value={filterStatus} onChange={e => setFS(e.target.value)}>
          <option value="all">All Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k} style={{ background: '#0d1520' }}>{v.label}</option>)}
        </select>

        <select style={SEL_STYLE} value={sortBy} onChange={e => setSort(e.target.value)}>
          <option value="lastPlayed" style={{ background: '#0d1520' }}>Last Played</option>
          <option value="name"       style={{ background: '#0d1520' }}>Name A–Z</option>
          <option value="playtime"   style={{ background: '#0d1520' }}>Most Played</option>
          <option value="dateAdded"  style={{ background: '#0d1520' }}>Date Added</option>
          <option value="rating"     style={{ background: '#0d1520' }}>Rating</option>
        </select>

        {/* Genre filter button */}
        {allGenres.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowGenrePanel(s => !s)}
              style={{ ...SEL_STYLE, background: filterGenre !== 'all' ? `${accent}18` : C.surface, borderColor: filterGenre !== 'all' ? accent + '55' : C.border, color: filterGenre !== 'all' ? accent : C.text, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="tag" size={12} color={filterGenre !== 'all' ? accent : C.text} />
              {filterGenre !== 'all' ? filterGenre : 'GENRE'}
            </button>
            {showGenrePanel && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'#080f1a', border:`1px solid ${accent}33`, zIndex:100, minWidth:180, maxHeight:260, overflowY:'auto', clipPath:'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', boxShadow:'0 8px 32px rgba(0,0,0,0.8)' }}
                onMouseLeave={() => setShowGenrePanel(false)}>
                <div onClick={() => { setFG('all'); setShowGenrePanel(false) }}
                  style={{ padding:'7px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.08em', color: filterGenre === 'all' ? accent : C.textDim, background: filterGenre==='all' ? `${accent}10` : 'transparent', borderBottom:`1px solid ${C.border}` }}>
                  ALL GENRES
                </div>
                {allGenres.map(g => (
                  <div key={g} onClick={() => { setFG(g); setShowGenrePanel(false) }}
                    style={{ padding:'7px 12px', cursor:'pointer', fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:600, color: filterGenre===g ? accent : C.text, background: filterGenre===g ? `${accent}10` : 'transparent', transition:'background 0.1s' }}
                    onMouseEnter={e => { if(filterGenre!==g) e.currentTarget.style.background = `${accent}08` }}
                    onMouseLeave={e => { if(filterGenre!==g) e.currentTarget.style.background = 'transparent' }}>
                    {g}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select mode toggle */}
        <button onClick={() => { setSelecting(s => !s); clearSelection() }}
          style={{ ...SEL_STYLE, background: selecting ? `${accent}18` : C.surface, borderColor: selecting ? accent + '55' : C.border, color: selecting ? accent : C.text, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="check" size={12} color={selecting ? accent : C.text} />
          {selecting ? `${selectedIds.size} SEL` : 'SELECT'}
        </button>
        {selecting && selectedIds.size < filtered.length && (
          <button onClick={selectAll}
            style={{ fontSize: 11, fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.08em', fontWeight: 700, color: accent, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
            ALL
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim }}>
          {filtered.length}{filtered.length !== games.length ? `/${games.length}` : ''} RECORDS
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 3 }}>
          {['grid', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: view === v ? `${accent}22` : C.surface, border: `1px solid ${view === v ? accent + '55' : C.border}`, color: view === v ? accent : C.textDim, cursor: 'pointer', transition: 'all 0.15s', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
              <Icon name={v} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────── */}
      {activeFilters.length > 0 && (
        <div style={{ padding: '8px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`, background: `${accent}05` }}>
          {activeFilters.map(f => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${accent}15`, border: `1px solid ${accent}44`, padding: '3px 10px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)' }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent }}>{f.label}</span>
              <button onClick={f.onClear} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}>
                <Icon name="x" size={10} color={accent} />
              </button>
            </div>
          ))}
          <button onClick={() => { setFP('all'); setFS('all'); setFG('all') }}
            style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textDim, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}>
            CLEAR ALL
          </button>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20, paddingTop: 16 }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
            <Icon name="library" size={48} color={C.border} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textDim, marginBottom: 8 }}>
                {activeFilters.length || searchVal ? 'No Matches' : 'Library Empty'}
              </div>
              <div style={{ fontSize: 13, color: C.textDim, marginBottom: 18 }}>
                {activeFilters.length || searchVal ? 'Adjust your filters or search' : 'Add your first game to get started'}
              </div>
              {!activeFilters.length && !searchVal ? (
                <RsiButton onClick={onAdd} variant="primary" accent={accent}>
                  <Icon name="plus" size={13} color={accent} /> ADD GAME
                </RsiButton>
              ) : (
                <RsiButton onClick={() => { setFP('all'); setFS('all'); setFG('all') }} variant="ghost" accent={accent}>
                  CLEAR FILTERS
                </RsiButton>
              )}
            </div>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${cardSize},1fr))`, gap: cardGap }}>
            {filtered.map(g => (
              <div key={g.id} style={{ position: 'relative' }}>
                {selecting && (
                  <div onClick={e => { e.stopPropagation(); toggleSelect(g.id) }}
                    style={{ position: 'absolute', top: 8, left: 8, zIndex: 10, width: 20, height: 20, background: selectedIds.has(g.id) ? accent : 'rgba(6,10,16,0.85)', border: `1px solid ${selectedIds.has(g.id) ? accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)', backdropFilter: 'blur(4px)', transition: 'all 0.15s', boxShadow: selectedIds.has(g.id) ? `0 0 8px ${accent}` : 'none' }}>
                    {selectedIds.has(g.id) && <Icon name="check" size={11} color="#080c12" />}
                  </div>
                )}
                <GameCardGrid game={g} onSelect={selecting ? () => toggleSelect(g.id) : onSelect} onToggleFav={onToggleFav} onEdit={onEdit} onDelete={onDelete} accent={accent} showAchBadges={showAchBadges} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {selecting && (
                  <div onClick={() => toggleSelect(g.id)}
                    style={{ width: 20, height: 20, background: selectedIds.has(g.id) ? accent : C.surface, border: `1px solid ${selectedIds.has(g.id) ? accent : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, clipPath: 'polygon(3px 0%,100% 0%,100% calc(100% - 3px),calc(100% - 3px) 100%,0% 100%,0% 3px)', transition: 'all 0.15s' }}>
                    {selectedIds.has(g.id) && <Icon name="check" size={11} color="#080c12" />}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <GameCardList game={g} onSelect={selecting ? () => toggleSelect(g.id) : onSelect} onToggleFav={onToggleFav} onEdit={onEdit} onDelete={onDelete} accent={accent} showAchBadges={showAchBadges} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BulkActionsBar selectedIds={[...selectedIds]} onClear={clearSelection}
        onDelete={() => { if (!window.confirm(`Remove ${selectedIds.size} game${selectedIds.size !== 1 ? 's' : ''}?`)) return; onBulkDelete?.([...selectedIds]); clearSelection() }}
        onSetStatus={s => { onBulkStatus?.([...selectedIds], s); clearSelection() }}
        onFavorite={() => { onBulkFavorite?.([...selectedIds]); clearSelection() }}
        accent={accent}
      />
    </div>
  )
}
