import React, { useState, useCallback, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Modal, { FormField } from '../ui/Modal'
import Icon from '../ui/Icon'
import { PLATFORM_META, STATUS_META } from '../../data/constants'
import { C, RsiButton, RsiSpinner } from '../ui/RSI'
import { useToast } from '../../hooks/useToast'

const isElectron = typeof window.launchpad !== 'undefined'

const INP = {
  width: '100%', background: '#0d1520', border: `1px solid #1a2d45`,
  color: '#c8dce8', padding: '9px 12px', fontSize: 13,
  outline: 'none', fontFamily: "'Share Tech Mono', monospace", letterSpacing: '0.02em',
}
const SEL = { ...INP, cursor: 'pointer', appearance: 'none', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }

function normalizeResult(result, source) {
  if (source === 'steam' || result.source === 'steam') {
    // Already normalized by main process getSteamDetails
    return result
  }
  if (source === 'rawg' || result.source === 'rawg') {
    const genres = (result.genres || []).map(g => g.name || g)
    const devs   = (result.developers || []).map(d => d.name).join(', ')
    const pubs   = (result.publishers || []).map(p => p.name).join(', ')
    const tags   = (result.tags || []).slice(0, 8).map(t => t.name || t)
    return {
      title:        result.name || '',
      platform:     'other',
      coverUrl:     result.background_image || '',
      backgroundUrl: result.background_image_additional || result.background_image || '',
      description:  result.description_raw || (result.description || '').replace(/<[^>]+>/g, '').slice(0, 600),
      genre:        genres,
      developer:    devs,
      publisher:    pubs,
      releaseYear:  result.released ? parseInt(result.released.split('-')[0]) : null,
      rating:       result.rating ? Math.round(result.rating * 2 * 10) / 10 : 0,
      tags,
    }
  }
  if (source === 'igdb' || result.source === 'igdb') {
    const g    = result._fullData || result
    const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null
    return {
      title:        result.name || g.name || '',
      platform:     'other',
      coverUrl:     result.background_image || '',
      backgroundUrl: result.background_image || '',
      description:  result.description || g.summary || '',
      genre:        (result.genres || []).map(gr => gr.name || gr),
      developer:    result.developer || '',
      publisher:    result.publisher || '',
      releaseYear:  isNaN(year) ? null : year,
      rating:       result.rating ? +result.rating.toFixed(1) : 0,
      tags:         [],
    }
  }
  // Generic fallback
  return {
    title:       result.name || result.title || '',
    platform:    'other',
    coverUrl:    result.background_image || result.coverUrl || '',
    backgroundUrl: result.backgroundUrl || '',
    description: result.description || '',
    genre:       (result.genres || []).map(g => g.name || g),
    developer:   result.developer || '',
    publisher:   result.publisher || '',
    releaseYear: result.released ? parseInt(result.released) : null,
    rating:      result.rating || 0,
    tags:        [],
  }
}

function SearchStep({ onSelectResult, onManual, apiKeys, getApiKeys, accent }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [errors, setErrors]   = useState([])
  const [loadingId, setLoadingId] = useState(null)
  const debounce = useRef(null)
  const toast = useToast()

  const doSearch = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setResults([]); setErrors([]); return }
    setSearching(true)
    setErrors([])
    try {
      let data
      if (isElectron) {
        // Resolve secure keys - getApiKeys fetches from OS-encrypted storage
        const keys = getApiKeys ? await getApiKeys() : apiKeys
        data = await window.launchpad.searchGames(q, {})
      } else {
        // Browser fallback - try RAWG directly if key exists, else show message
        if (apiKeys.rawgApiKey) {
          const res = await fetch(`https://api.rawg.io/api/games?key=${encodeURIComponent(apiKeys.rawgApiKey)}&search=${encodeURIComponent(q)}&page_size=8&search_precise=true`)
          if (!res.ok) throw new Error(`RAWG returned ${res.status}`)
          const json = await res.json()
          data = { results: (json.results || []).map(r => ({ ...r, source: 'rawg' })), errors: [] }
        } else {
          data = { results: [], errors: ['Browser mode: add a RAWG API key in Settings for search to work'] }
        }
      }
      setResults(data.results || [])
      if (data.errors?.length) setErrors(data.errors)
    } catch(e) {
      setResults([])
      setErrors([e.message])
      toast('Search failed: ' + e.message, 'error')
    }
    setSearching(false)
  }, [apiKeys, getApiKeys, toast])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(() => doSearch(q), 450)
  }

  async function handleSelect(r) {
    setLoadingId(r.id)
    try {
      let details = null
      if (isElectron) {
        const keys = getApiKeys ? await getApiKeys() : apiKeys
        const res = await window.launchpad.getGameDetails(r, {})
        if (res.success) details = normalizeResult(res.game, res.source || r.source)
      }
      if (!details) details = normalizeResult(r, r.source)
      onSelectResult(details)
    } catch(e) {
      onSelectResult(normalizeResult(r, r.source))
    }
    setLoadingId(null)
  }

  const hasKeys = isElectron || !!apiKeys.rawgApiKey
  const sourcesActive = [
    isElectron ? 'Steam (free)' : null,
    apiKeys.rawgApiKey ? 'RAWG' : null,
    (apiKeys.igdbClientId && apiKeys.igdbClientSecret) ? 'IGDB' : null,
  ].filter(Boolean)

  return (
    <div>
      {/* Active sources badge */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {isElectron && <span style={{ fontSize: 11, fontWeight: 700, background: '#10b98122', color: '#10b981', border: '1px solid #10b98133', borderRadius: 0, padding: '2px 8px' }}>Steam ✓</span>}
        <span style={{ fontSize: 11, fontWeight: 700, background: apiKeys.rawgApiKey ? '#10b98122' : '#2a2a3844', color: apiKeys.rawgApiKey ? '#10b981' : '#555', border: `1px solid ${apiKeys.rawgApiKey ? '#10b98133' : '#2a2a38'}`, borderRadius: 0, padding: '2px 8px' }}>
          RAWG {apiKeys.rawgApiKey ? '✓' : '- no key'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, background: (apiKeys.igdbClientId && apiKeys.igdbClientSecret) ? '#10b98122' : '#2a2a3844', color: (apiKeys.igdbClientId && apiKeys.igdbClientSecret) ? '#10b981' : '#555', border: `1px solid ${(apiKeys.igdbClientId && apiKeys.igdbClientSecret) ? '#10b98133' : '#2a2a38'}`, borderRadius: 0, padding: '2px 8px' }}>
          IGDB {(apiKeys.igdbClientId && apiKeys.igdbClientSecret) ? '✓' : '- no credentials'}
        </span>
        {!isElectron && !apiKeys.rawgApiKey && (
          <span style={{ fontSize: 11, color: '#f59e0b' }}>Add API keys in Settings for better results</span>
        )}
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}>
          <Icon name="search" size={15} color="#555" />
        </div>
        <input
          autoFocus
          style={{ ...INP, paddingLeft: 34 }}
          placeholder={isElectron ? 'Search across Steam, RAWG, IGDB…' : 'Search game title…'}
          value={query}
          onChange={handleChange}
          onKeyDown={e => e.key === 'Enter' && doSearch(query)}
        />
        {searching && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${accent}44`, borderTop: `2px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}
      </div>

      {/* Error notices */}
      {errors.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          {errors.map((err, i) => (
            <div key={i} style={{ fontSize: 12, color: '#f59e0b', background: '#f59e0b11', border: '1px solid #f59e0b22', borderRadius: 6, padding: '6px 10px', marginBottom: 4 }}>
              ⚠ {err}
            </div>
          ))}
        </div>
      )}

      {/* Results list */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{ border: '1px solid #1a2d45', borderRadius: 10, overflow: 'hidden', marginBottom: 14, maxHeight: 340, overflowY: 'auto' }}>
            {results.map((r, i) => {
              const isLoading = loadingId === r.id
              const sourceColors = { steam: '#66c0f4', rawg: '#a855f7', igdb: '#f59e0b' }
              return (
                <div key={r.id + i}
                  onClick={() => !loadingId && handleSelect(r)}
                  style={{ display: 'flex', gap: 12, padding: '10px 14px', cursor: loadingId ? 'wait' : 'pointer', background: isLoading ? `${accent}18` : 'transparent', borderBottom: i < results.length - 1 ? '1px solid #1e1e26' : 'none', transition: 'background 0.1s', alignItems: 'center' }}
                  onMouseEnter={e => { if (!loadingId) e.currentTarget.style.background = '#0d1520' }}
                  onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'transparent' }}
                >
                  {r.background_image
                    ? <img src={r.background_image} alt="" style={{ width: 54, height: 38, objectFit: 'cover', borderRadius: 0, flexShrink: 0 }} onError={e => { e.target.style.display='none' }} />
                    : <div style={{ width: 54, height: 38, background: '#0d1520', borderRadius: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="image" size={16} color="#333" />
                      </div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#c8dce8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {r.released ? (typeof r.released === 'string' ? r.released.split('-')[0] : r.released) : ''}
                      {r.genres?.length ? ` · ${r.genres.slice(0, 2).map(g => g.name || g).join(', ')}` : ''}
                      {r.rating ? ` · ★ ${typeof r.rating === 'number' ? r.rating.toFixed(1) : r.rating}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: sourceColors[r.source] || '#888', background: (sourceColors[r.source] || '#888') + '18', border: `1px solid ${(sourceColors[r.source] || '#888')}33`, borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' }}>
                      {r.source}
                    </span>
                    {isLoading
                      ? <div style={{ width: 14, height: 14, border: `2px solid ${accent}44`, borderTop: `2px solid ${accent}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      : <Icon name="chevronRight" size={14} color="#444" />
                    }
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {query.length >= 2 && results.length === 0 && !searching && (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 14, textAlign: 'center', padding: '16px 0', background: C.surface2 || '#0d1520', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', border: '1px solid #1a2d45' }}>
          <div style={{ marginBottom: 4 }}>No results for "{query}"</div>
          <div style={{ fontSize: 12, color: '#444' }}>Try a different spelling or add the game manually</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onManual} style={{ padding: '9px 20px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: '#0d1520', border: '1px solid #1a2d45', color: C.textDim, fontSize: 14, cursor: 'pointer' }}>
          Add Manually
        </button>
      </div>
    </div>
  )
}

function ExeStep({ form, setField, onNext, onBack, accent }) {
  const [picking, setPicking] = useState(false)
  const toast = useToast()

  async function handlePickExe() {
    if (!isElectron) { toast('File picker only works in the desktop app', 'info'); return }
    setPicking(true)
    const p = await window.launchpad.pickExe()
    setPicking(false)
    if (p) {
      setField('executablePath', p)
      if (!form.title) {
        const name = p.split(/[\\/]/).pop().replace(/\.exe$/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        setField('title', name)
      }
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: '#777', marginBottom: 16, lineHeight: 1.6 }}>
        Point to the game's executable so Launchpad can launch it and track your playtime.
        You can skip this and set it later from the game detail page.
      </p>

      <FormField label="Executable (.exe, .lnk, .sh…)">
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...INP, flex: 1 }} value={form.executablePath || ''} onChange={e => setField('executablePath', e.target.value)} placeholder="C:\Games\MyGame\game.exe" />
          <button onClick={handlePickExe} disabled={picking}
            style={{ padding: '9px 16px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: '#0d1520', border: '1px solid #1a2d45', color: C.textDim, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <Icon name="search" size={13} color="#aaa" /> {picking ? 'Picking…' : 'Browse'}
          </button>
        </div>
        {!isElectron && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>⚡ File picker requires the desktop (Electron) app. You can paste a path manually.</div>}
      </FormField>

      {form.title && (
        <FormField label="Title (auto-detected)">
          <input style={INP} value={form.title} onChange={e => setField('title', e.target.value)} />
        </FormField>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: 'none', border: '1px solid #1a2d45', color: '#888', fontSize: 14, cursor: 'pointer' }}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onNext} style={{ padding: '9px 18px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: '#0d1520', border: '1px solid #1a2d45', color: C.textDim, fontSize: 14, cursor: 'pointer' }}>Skip for now</button>
          <button onClick={onNext} style={{ padding: '9px 22px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: accent, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Continue →</button>
        </div>
      </div>
    </div>
  )
}

function EditStep({ form, setField, onSave, onBack, isEditing, accent }) {
  return (
    <div>
      {/* Cover preview + title row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 72, flexShrink: 0 }}>
          {form.coverUrl
            ? <img src={form.coverUrl} alt="" style={{ width: 72, height: 100, objectFit: 'cover', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', border: '1px solid #1a2d45' }} onError={e => e.target.style.display='none'} />
            : <div style={{ width: 72, height: 100, background: '#0d1520', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', border: '1px solid #1a2d45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="image" size={22} color="#333" />
              </div>
          }
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormField label="Title">
            <input style={INP} value={form.title || ''} onChange={e => setField('title', e.target.value)} placeholder="Game title" autoFocus={!form.title} />
          </FormField>
          <FormField label="Cover Image URL">
            <input style={INP} value={form.coverUrl || ''} onChange={e => setField('coverUrl', e.target.value)} placeholder="https://..." />
          </FormField>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <FormField label="Platform">
          <select style={SEL} value={form.platform || 'other'} onChange={e => setField('platform', e.target.value)}>
            {Object.entries(PLATFORM_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </FormField>
        <FormField label="Status">
          <select style={SEL} value={form.status || 'backlog'} onChange={e => setField('status', e.target.value)}>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </FormField>
        <FormField label="Developer">
          <input style={INP} value={form.developer || ''} onChange={e => setField('developer', e.target.value)} placeholder="Studio" />
        </FormField>
        <FormField label="Publisher">
          <input style={INP} value={form.publisher || ''} onChange={e => setField('publisher', e.target.value)} placeholder="Publisher" />
        </FormField>
        <FormField label="Release Year">
          <input style={INP} type="number" value={form.releaseYear || ''} onChange={e => setField('releaseYear', e.target.value)} placeholder="2024" />
        </FormField>
        <FormField label="Rating (0–10)">
          <input style={INP} type="number" min="0" max="10" step="0.5" value={form.rating || ''} onChange={e => setField('rating', e.target.value)} placeholder="8.5" />
        </FormField>
      </div>

      <FormField label="Genres (comma separated)">
        <input style={INP} value={Array.isArray(form.genre) ? form.genre.join(', ') : (form.genre || '')} onChange={e => setField('genre', e.target.value)} placeholder="RPG, Action, Open World" />
      </FormField>

      <FormField label="Description">
        <textarea style={{ ...INP, resize: 'vertical', minHeight: 68 }} value={form.description || ''} onChange={e => setField('description', e.target.value)} placeholder="Game description…" />
      </FormField>

      <FormField label="Executable Path">
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...INP, flex: 1 }} value={form.executablePath || ''} onChange={e => setField('executablePath', e.target.value)} placeholder="C:\Games\game.exe" />
          {isElectron && (
            <button onClick={async () => { const p = await window.launchpad.pickExe(); if (p) setField('executablePath', p) }}
              style={{ padding: '9px 14px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: '#0d1520', border: '1px solid #1a2d45', color: C.textDim, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="search" size={12} color="#aaa" /> Browse
            </button>
          )}
        </div>
      </FormField>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 8 }}>
        <button onClick={onBack} style={{ padding: '9px 18px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: 'none', border: '1px solid #1a2d45', color: '#888', fontSize: 14, cursor: 'pointer' }}>← Back</button>
        <button onClick={onSave} style={{ padding: '9px 28px', clipPath: 'polygon(4px 0%,100% 0%,100% calc(100% - 4px),calc(100% - 4px) 100%,0% 100%,0% 4px)', background: accent, color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: `0 0 20px ${accent}44` }}>
          {isEditing ? 'Save Changes' : 'Add to Library ✓'}
        </button>
      </div>
    </div>
  )
}

const STEPS = { SEARCH: 'search', EXE: 'exe', EDIT: 'edit' }
const STEP_IDX = { search: 0, exe: 1, edit: 2 }

export default function AddGameModal({ onClose, onAdd, editGame, apiKeys = {}, getApiKeys, accent = '#3b82f6' }) {
  const toast = useToast()
  const isEditing = !!editGame
  const [step, setStep] = useState(isEditing ? STEPS.EDIT : STEPS.SEARCH)
  const [form, setFormState] = useState(() => editGame ? {
    ...editGame,
    genre: Array.isArray(editGame.genre) ? editGame.genre.join(', ') : (editGame.genre || ''),
  } : {
    title: '', platform: 'other', coverUrl: '', backgroundUrl: '',
    description: '', genre: '', developer: '', publisher: '',
    releaseYear: '', rating: '', status: 'backlog', tags: '',
    notes: '', executablePath: '',
  })

  const setField = useCallback((key, value) => setFormState(f => ({ ...f, [key]: value })), [])

  function handleRawgResult(normalized) {
    setFormState(f => ({
      ...f, ...normalized,
      genre: Array.isArray(normalized.genre) ? normalized.genre.join(', ') : (normalized.genre || ''),
      status: f.status || 'backlog',
    }))
    setStep(STEPS.EXE)
  }

  function handleSave() {
    if (!form.title?.trim()) { toast('Please enter a game title', 'error'); return }
    const game = {
      ...form,
      id: editGame ? editGame.id : 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      genre: typeof form.genre === 'string' ? form.genre.split(',').map(s => s.trim()).filter(Boolean) : (form.genre || []),
      tags:  typeof form.tags  === 'string' ? form.tags.split(',').map(s => s.trim()).filter(Boolean)  : (form.tags  || []),
      rating:      parseFloat(form.rating) || 0,
      releaseYear: parseInt(form.releaseYear) || null,
      playtime:  editGame?.playtime  || 0,
      lastPlayed: editGame?.lastPlayed || null,
      dateAdded: editGame?.dateAdded || new Date().toISOString(),
      isFavorite: editGame?.isFavorite || false,
      sessions:  editGame?.sessions  || [],
    }
    onAdd(game)
    onClose()
    toast(isEditing ? `"${game.title}" updated!` : `"${game.title}" added to library!`, 'success')
  }

  const TITLES = {
    [STEPS.SEARCH]: 'Add Game - Search',
    [STEPS.EXE]:    'Set Executable',
    [STEPS.EDIT]:   isEditing ? 'Edit Game' : 'Review & Confirm',
  }

  return (
    <Modal title={isEditing ? 'Edit Game' : TITLES[step]} onClose={onClose} width={640}>
      {/* Progress bar */}
      {!isEditing && (
        <div style={{ display: 'flex', gap: 5, marginBottom: 20 }}>
          {[STEPS.SEARCH, STEPS.EXE, STEPS.EDIT].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: STEP_IDX[step] >= i ? accent : '#2a2a38', transition: 'background 0.3s' }} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.14 }}>
          {step === STEPS.SEARCH && (
            <SearchStep
              onSelectResult={handleRawgResult}
              onManual={() => setStep(STEPS.EDIT)}
              apiKeys={apiKeys}
              getApiKeys={getApiKeys}
              accent={accent}
            />
          )}
          {step === STEPS.EXE && (
            <ExeStep
              form={form} setField={setField}
              onNext={() => setStep(STEPS.EDIT)}
              onBack={() => setStep(STEPS.SEARCH)}
              accent={accent}
            />
          )}
          {step === STEPS.EDIT && (
            <EditStep
              form={form} setField={setField}
              onSave={handleSave}
              onBack={() => setStep(isEditing ? STEPS.EDIT : STEPS.EXE)}
              isEditing={isEditing}
              accent={accent}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  )
}
