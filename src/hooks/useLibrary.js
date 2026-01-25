import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'launchpad_games_v2'

export function useLibrary() {
  const [games, setGames] = useState([])
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef(null)

  // Load on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY)
        if (res?.value) {
          const parsed = JSON.parse(res.value)
          if (Array.isArray(parsed)) {
            setGames(parsed)
            console.log(`[library] Loaded ${parsed.length} games`)
          }
        }
      } catch (e) {
        console.error('[library] Load error:', e)
      }
      setLoaded(true)
    })()
  }, [])

  // Debounced save - waits 400ms after last change to avoid hammering storage
  const save = useCallback((newGames) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(newGames))
        console.log(`[library] Saved ${newGames.length} games`)
      } catch (e) {
        console.error('[library] Save error:', e)
      }
    }, 400)
  }, [])

  const setAndSave = useCallback((updater) => {
    setGames(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      save(next)
      return next
    })
  }, [save])

  const addOrUpdateGame = useCallback((game) => {
    setAndSave(gs => {
      const idx = gs.findIndex(g => g.id === game.id)
      if (idx >= 0) { const n = [...gs]; n[idx] = game; return n }
      return [...gs, game]
    })
  }, [setAndSave])

  const deleteGame = useCallback((id) => {
    setAndSave(gs => gs.filter(g => g.id !== id))
  }, [setAndSave])

  const toggleFavorite = useCallback((id) => {
    setAndSave(gs => gs.map(g => g.id === id ? { ...g, isFavorite: !g.isFavorite } : g))
  }, [setAndSave])

  const updateNotes = useCallback((id, notes) => {
    setAndSave(gs => gs.map(g => g.id === id ? { ...g, notes } : g))
  }, [setAndSave])

  const addSession = useCallback((id, durationMins) => {
    const today = new Date().toISOString().split('T')[0]
    setAndSave(gs => gs.map(g => {
      if (g.id !== id) return g
      return {
        ...g,
        playtime: (g.playtime || 0) + durationMins,
        lastPlayed: new Date().toISOString(),
        sessions: [...(g.sessions || []), { date: today, duration: durationMins }],
      }
    }))
  }, [setAndSave])

  const updateExecutable = useCallback((id, executablePath) => {
    setAndSave(gs => gs.map(g => g.id === id ? { ...g, executablePath } : g))
  }, [setAndSave])

  // Toggle an achievement unlock for a game
  const toggleAchievement = useCallback((gameId, achievementId) => {
    setAndSave(gs => gs.map(g => {
      if (g.id !== gameId) return g
      const current = g.achievements || []
      const idx = current.findIndex(a => a.id === achievementId)
      if (idx >= 0) {
        // Toggle existing
        const updated = [...current]
        updated[idx] = { ...updated[idx], unlocked: !updated[idx].unlocked, unlockedAt: !updated[idx].unlocked ? new Date().toISOString() : null }
        return { ...g, achievements: updated }
      }
      return g
    }))
  }, [setAndSave])

  // Seed default achievements for a game (called when first viewing achievements tab)
  const seedAchievements = useCallback((gameId, achievements) => {
    setAndSave(gs => gs.map(g => {
      if (g.id !== gameId || g.achievements?.length) return g
      return { ...g, achievements }
    }))
  }, [setAndSave])

  return { games, loaded, addOrUpdateGame, deleteGame, toggleFavorite, updateNotes, addSession, updateExecutable, toggleAchievement, seedAchievements }
}
