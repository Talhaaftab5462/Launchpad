import React, { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { C } from './components/ui/RSI'

import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import CommandPalette from './components/ui/CommandPalette'
import { ToastContainer } from './components/ui/Toast'
import { ToastContext, useToastState } from './hooks/useToast'
import { useLibrary } from './hooks/useLibrary'
import { useSettings } from './hooks/useSettings'
import { useGameLauncher } from './hooks/useGameLauncher'
import { useNotifications } from './hooks/useNotifications'
import { useDiscord } from './hooks/useDiscord'
import { useProfile } from './hooks/useProfile'
import ProfilePanel from './components/ui/ProfilePanel'

import HomePage from './pages/HomePage'
import LibraryPage from './pages/LibraryPage'
import PlatformsPage from './pages/PlatformsPage'
import CollectionsPage from './pages/CollectionsPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import GameDetailPage from './pages/GameDetailPage'
import AddGameModal from './components/library/AddGameModal'
import FriendsPage from './pages/FriendsPage'

function usePersisted(key, initial) {
  const [value, setValue] = useState(initial)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    ;(async () => {
      try { const r = await window.storage.get(key); if (r?.value) setValue(JSON.parse(r.value)) } catch(e) {}
      setLoaded(true)
    })()
  }, [key])
  useEffect(() => {
    if (!loaded) return
    window.storage.set(key, JSON.stringify(value)).catch(() => {})
  }, [value, loaded, key])
  return [value, setValue]
}

function EmptyLibrary({ onAdd, accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 24 }}>
      <div style={{ width: 80, height: 80, borderRadius: 22, background: `${accent}18`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/>
          <line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/>
          <path d="M17.32 5H6.68a4 4 0 00-3.978 3.59l-1.37 12.18A3 3 0 004.32 24h15.36a3 3 0 002.99-3.22l-1.37-12.18A4 4 0 0017.32 5z"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#e8e8ec', marginBottom: 8 }}>Welcome to Launchpad</div>
        <div style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
          Your library is empty. Add games by searching their name to auto-fill metadata from Steam, RAWG, and IGDB - or browse directly to a .exe.
        </div>
        <button onClick={onAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', clipPath: 'polygon(8px 0%,100% 0%,100% calc(100% - 8px),calc(100% - 8px) 100%,0% 100%,0% 8px)', background: accent, color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: `0 0 32px ${accent}44` }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Your First Game
        </button>
      </div>
      <div style={{ display: 'flex', gap: 28, marginTop: 8 }}>
        {[['🔍', 'Search by name', 'Auto-fills all metadata'], ['📁', 'Browse .exe', 'Point to any game file'], ['⚡', 'Live tracking', 'Real-time session timer']].map(([icon, t, d]) => (
          <div key={t} style={{ textAlign: 'center', maxWidth: 110 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{t}</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const { games, loaded, addOrUpdateGame, deleteGame, toggleFavorite, updateNotes, addSession, toggleAchievement, seedAchievements } = useLibrary()
  const { settings, updateSetting } = useSettings()
  const { toasts, addToast } = useToastState()
  const notifs = useNotifications()
  const [collections, setCollections]         = usePersisted('launchpad_collections', [])
  const [connectedPlatforms, setConnectedPlat] = usePersisted('launchpad_platforms', [])
  const [platformProfiles, setPlatformProfiles] = usePersisted('launchpad_platform_profiles', {})

  const { profile, updateProfile } = useProfile()
  const [showProfile, setShowProfile] = useState(false)

  const [page, setPage]               = useState('home')
  const [searchVal, setSearchVal]     = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editGame, setEditGame]       = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [showPalette, setShowPalette] = useState(false)

  // Game launcher - real Electron or browser demo
  const launcher = useGameLauncher({
    onSessionEnd: useCallback((gameId, mins) => {
      addSession(gameId, mins)
      const g = games.find(g => g.id === gameId)
      const title = g?.title || 'Unknown game'
      addToast(`Session logged: ${mins}m · ${title}`, 'success')
      notifs.addNotification('session', `${title} - session ended`, `Played for ${mins} minute${mins !== 1 ? 's' : ''}`, { gameId, durationMins: mins })
    }, [addSession, addToast, games, notifs.addNotification]),
    onError: useCallback((err) => {
      addToast('Launch failed: ' + err, 'error')
      notifs.addNotification('error', 'Launch failed', err)
    }, [addToast, notifs.addNotification]),
  })

  // Running game object
  const runningGame = launcher.runningGameId ? games.find(g => g.id === launcher.runningGameId) || null : null

  // Discord Rich Presence
  const discord = useDiscord({ games, runningGame, launcher, settings })

  // Keep selectedGame in sync with library
  useEffect(() => {
    if (selectedGame) {
      const updated = games.find(g => g.id === selectedGame.id)
      if (updated) setSelectedGame(updated)
    }
  }, [games])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowPalette(p => !p); return }
      if (e.key === 'Escape') {
        if (showPalette)  { setShowPalette(false); return }
        if (selectedGame) { setSelectedGame(null); return }
        if (showAddModal || editGame) { setShowAddModal(false); setEditGame(null) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedGame, showAddModal, editGame, showPalette])

  const isElectron = typeof window.electronAPI !== 'undefined' && window.electronAPI.isElectron

  // Tell tray when a game starts/stops (so close button minimizes to tray)
  useEffect(() => {
    if (!isElectron) return
    window.electronAPI.setGameRunning(!!launcher.runningGameId)
  }, [isElectron, launcher.runningGameId])

  // Sync accent color to tray icon/menu on every settings change
  useEffect(() => {
    if (!isElectron) return
    window.electronAPI.updateTrayTheme(settings.accentColor || '#3b82f6')
  }, [isElectron, settings.accentColor])

  // Listen for tray right-click navigation events
  useEffect(() => {
    if (!isElectron) return
    const off = window.electronAPI.onTrayNavigate((targetPage) => {
      setPage(targetPage)
      setSelectedGame(null)
    })
    return off
  }, [isElectron])

  const handleApplyScLogs = useCallback(({ sessions, playtime, lastPlayed }) => {
    const g = games.find(g => g.id === selectedGame?.id)
    if (!g) return
    addOrUpdateGame({ ...g, sessions, playtime, lastPlayed: lastPlayed || g.lastPlayed })
    addToast(`Star Citizen: ${sessions.length} sessions imported · ${Math.floor(playtime/60)}h total`, 'success')
  }, [games, selectedGame, addOrUpdateGame, addToast])

  const handleSaveGoal = useCallback((id, goalMins) => {
    const g = games.find(g => g.id === id)
    if (g) addOrUpdateGame({ ...g, playtimeGoal: goalMins })
  }, [games, addOrUpdateGame])

  const handleStatusChange = useCallback((id, status) => {
    const g = games.find(g => g.id === id)
    if (g) { addOrUpdateGame({ ...g, status }); addToast(`Status → ${status}`, 'success') }
  }, [games, addOrUpdateGame, addToast])

  const handleRateGame = useCallback((id, rating) => {
    const g = games.find(g => g.id === id)
    if (g) addOrUpdateGame({ ...g, rating })
  }, [games, addOrUpdateGame])

  const handleSaveScreenshots = useCallback((id, screenshots) => {
    const g = games.find(g => g.id === id)
    if (g) addOrUpdateGame({ ...g, screenshots })
  }, [games, addOrUpdateGame])

  const handleDeleteGame = useCallback((id) => {
    deleteGame(id); addToast('Game removed', 'info')
  }, [deleteGame, addToast])

  const handleToggleFav = useCallback((id) => {
    const game = games.find(g => g.id === id)
    toggleFavorite(id)
    addToast(game?.isFavorite ? 'Removed from favorites' : '⭐ Added to favorites', 'success')
  }, [games, toggleFavorite, addToast])

  const handleBulkDelete = useCallback((ids) => {
    ids.forEach(id => deleteGame(id))
    addToast(`Removed ${ids.length} game${ids.length !== 1 ? 's' : ''}`, 'info')
  }, [deleteGame, addToast])

  const handleBulkStatus = useCallback((ids, status) => {
    ids.forEach(id => {
      const g = games.find(g => g.id === id)
      if (g) addOrUpdateGame({ ...g, status })
    })
    addToast(`Updated ${ids.length} game${ids.length !== 1 ? 's' : ''}`, 'success')
  }, [games, addOrUpdateGame, addToast])

  const handleBulkFavorite = useCallback((ids) => {
    ids.forEach(id => toggleFavorite(id))
    addToast(`Toggled favorites for ${ids.length} game${ids.length !== 1 ? 's' : ''}`, 'success')
  }, [toggleFavorite, addToast])

  const handleImportGames = useCallback((importedGames) => {
    let count = 0
    importedGames.forEach(g => {
      addOrUpdateGame({ ...g, id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2), isFavorite: false, sessions: [], lastPlayed: null, dateAdded: new Date().toISOString(), description: g.description || '', developer: g.developer || '', publisher: g.publisher || '', releaseYear: g.releaseYear || null, rating: 0, tags: g.tags || [], notes: '', backgroundUrl: g.backgroundUrl || '', executablePath: '' })
      count++
    })
    notifs.addNotification('import', `Imported ${count} game${count !== 1 ? 's' : ''}`, `From platform connection`, {})
  }, [addOrUpdateGame, notifs.addNotification])

  const handleClearLibrary = useCallback(async () => {
    try { await window.storage.set('launchpad_games_v2', JSON.stringify([])) } catch(e) {}
    window.location.reload()
  }, [])

  const togglePlatform = useCallback((key, isConnect) => {
    setConnectedPlat(c => isConnect ? [...new Set([...c, key])] : c.filter(k => k !== key))
  }, [setConnectedPlat])

  const accent = settings.accentColor || '#3b82f6'
  // Secure API keys - loaded fresh from secure storage when needed, not stored in component state
  const getApiKeys = async () => {
    const isElectron = typeof window.secureStorage !== 'undefined'
    if (isElectron) {
      const [rawg, igdbId, igdbSecret] = await Promise.all([
        window.secureStorage.get('rawgApiKey'),
        window.secureStorage.get('igdbClientId'),
        window.secureStorage.get('igdbClientSecret'),
      ])
      return {
        rawgApiKey:       rawg?.value       || settings.rawgApiKey       || '',
        igdbClientId:     igdbId?.value     || settings.igdbClientId     || '',
        igdbClientSecret: igdbSecret?.value || settings.igdbClientSecret || '',
      }
    }
    // Browser mode - settings hold the values directly
    return { rawgApiKey: settings.rawgApiKey || '', igdbClientId: settings.igdbClientId || '', igdbClientSecret: settings.igdbClientSecret || '' }
  }
  // For non-Electron (browser preview), still pass settings directly
  const apiKeys = { rawgApiKey: settings.rawgApiKey !== '__SECURED__' ? settings.rawgApiKey : '', igdbClientId: settings.igdbClientId !== '__SECURED__' ? settings.igdbClientId : '', igdbClientSecret: settings.igdbClientSecret !== '__SECURED__' ? settings.igdbClientSecret : '' }
  const showEmpty = loaded && games.length === 0

  if (!loaded) return (
    <div style={{ display: 'flex', height: '100vh', background: '#080c12', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="11" x2="10" y2="11"/><line x1="8" y1="9" x2="8" y2="13"/>
          <line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/>
          <path d="M17.32 5H6.68a4 4 0 00-3.978 3.59l-1.37 12.18A3 3 0 004.32 24h15.36a3 3 0 002.99-3.22l-1.37-12.18A4 4 0 0017.32 5z"/>
        </svg>
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: C.textDim, letterSpacing: '0.1em' }}>INITIALIZING LAUNCHPAD…</div>
    </div>
  )

  return (
    <ToastContext.Provider value={addToast}>
      <div style={{ display: 'flex', height: '100vh', background: '#080c12', overflow: 'hidden', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: '#e8e8ec' }}>

        <Sidebar
          current={page}
          onNav={p => { setPage(p); setSearchVal('') }}
          collapsed={settings.sidebarCollapsed}
          onToggle={() => updateSetting('sidebarCollapsed', !settings.sidebarCollapsed)}
          accent={accent}
          runningGame={runningGame}
          games={games}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <TopBar
            onAdd={() => setShowAddModal(true)}
            onOpenPalette={() => setShowPalette(true)}
            onOpenProfile={() => setShowProfile(true)}
            accent={accent}
            runningGame={runningGame}
            profile={profile}
            notifications={{
              list: notifs.notifications,
              unreadCount: notifs.unreadCount,
              markAllRead: notifs.markAllRead,
              markRead: notifs.markRead,
              clearAll: notifs.clearAll,
            }}
          />

          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {showEmpty && page !== 'settings' && page !== 'stats'
              ? <EmptyLibrary onAdd={() => setShowAddModal(true)} accent={accent} />
              : <>
                  {page === 'home'        && <HomePage games={games} onSelect={setSelectedGame} accent={accent} launcher={launcher} />}
                  {page === 'library'     && <LibraryPage games={games} onSelect={setSelectedGame} onToggleFav={handleToggleFav} onEdit={g => setEditGame(g)} onDelete={handleDeleteGame} onBulkDelete={handleBulkDelete} onBulkStatus={handleBulkStatus} onBulkFavorite={handleBulkFavorite} searchVal={searchVal} onAdd={() => setShowAddModal(true)} accent={accent} defaultView={settings.defaultView} density={settings.density || 'comfortable'} showAchBadges={settings.showAchBadges !== false} />}
                  {page === 'platforms'   && <PlatformsPage connectedPlatforms={connectedPlatforms} onConnect={togglePlatform} onImportGames={handleImportGames} platformProfiles={platformProfiles} onSaveProfile={(key, profile) => setPlatformProfiles(p => profile ? {...p,[key]:profile} : Object.fromEntries(Object.entries(p).filter(([k])=>k!==key)))} accent={accent} />}
                  {page === 'collections' && <CollectionsPage games={games} collections={collections} onCollectionsChange={setCollections} onSelectGame={setSelectedGame} accent={accent} />}
                  {page === 'stats'       && <StatsPage games={games} accent={accent} />}
                  {page === 'friends'     && <FriendsPage accent={accent} />}
                  {page === 'settings'    && <SettingsPage settings={settings} onUpdate={updateSetting} onClearLibrary={handleClearLibrary} accent={accent} discord={discord} games={games} />}
                </>
            }
          </div>
        </div>

        <AnimatePresence>
          {showPalette && <CommandPalette games={games} onSelect={g => { setSelectedGame(g); setShowPalette(false) }} onClose={() => setShowPalette(false)} accent={accent} />}
        </AnimatePresence>

        <AnimatePresence>
          {(showAddModal || editGame) && (
            <AddGameModal onClose={() => { setShowAddModal(false); setEditGame(null) }} onAdd={addOrUpdateGame} editGame={editGame} accent={accent} apiKeys={apiKeys} getApiKeys={getApiKeys} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedGame && (
            <GameDetailPage game={selectedGame} onClose={() => setSelectedGame(null)} onEdit={g => { setSelectedGame(null); setEditGame(g) }} onDelete={id => { handleDeleteGame(id); setSelectedGame(null) }} onToggleFav={handleToggleFav} onUpdateNotes={updateNotes} onToggleAchievement={toggleAchievement} onSeedAchievements={seedAchievements} onSaveScreenshots={handleSaveScreenshots} onRateGame={handleRateGame} onStatusChange={handleStatusChange} onSaveGoal={handleSaveGoal} onApplyScLogs={handleApplyScLogs} launcher={launcher} accent={accent} bgBlur={settings.bgBlur ?? 3} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProfile && (
            <ProfilePanel
              profile={profile}
              onUpdate={updateProfile}
              games={games}
              platformProfiles={platformProfiles}
              onClose={() => setShowProfile(false)}
              accent={accent}
            />
          )}
        </AnimatePresence>

        <ToastContainer toasts={toasts} />
      </div>
    </ToastContext.Provider>
  )
}
