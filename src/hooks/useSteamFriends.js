import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'launchpad_steam_friends_cache'
const CACHE_TTL = 5 * 60 * 1000  // 5 min

const isElectron = typeof window !== 'undefined' && typeof window.launchpad !== 'undefined'

export function useSteamFriends() {
  const [friends,        setFriends]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [lastFetched,    setLastFetched]    = useState(null)
  const [steamConnected, setSteamConnected] = useState(false)

  // Load cached friends immediately on mount
  useEffect(() => {
    ;(async () => {
      try {
        const r = await window.storage.get(CACHE_KEY)
        if (r?.value) {
          const cached = JSON.parse(r.value)
          if (Array.isArray(cached.friends)) {
            setFriends(cached.friends)
            setLastFetched(cached.fetchedAt)
          }
        }
      } catch(e) {}
    })()
  }, [])

  const fetchFriends = useCallback(async (force = false) => {
    let apiKey, steamId

    // Primary: platform profiles (written on connect with _fields fix)
    try {
      const r = await window.storage.get('launchpad_platform_profiles')
      if (r?.value) {
        const profiles = JSON.parse(r.value)
        const sp = profiles?.steam
        if (sp) { apiKey = sp.apiKey || sp.key; steamId = sp.steamId || sp.id }
      }
    } catch(e) {}

    // Fallback 1: dedicated steam creds key
    if (!apiKey || !steamId) {
      try {
        const r = await window.storage.get('launchpad_steam_creds')
        if (r?.value) {
          const c = JSON.parse(r.value)
          apiKey  = apiKey  || c.apiKey
          steamId = steamId || c.steamId
        }
      } catch(e) {}
    }

    // Fallback 2: settings
    if (!apiKey || !steamId) {
      try {
        const r = await window.storage.get('launchpad_settings')
        if (r?.value) {
          const s = JSON.parse(r.value)
          apiKey  = apiKey  || s.steamApiKey
          steamId = steamId || s.steamId
        }
      } catch(e) {}
    }

    if (!apiKey || !steamId) { setSteamConnected(false); return }
    setSteamConnected(true)

    if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL) return

    setLoading(true); setError(null)
    try {
      let result
      if (isElectron) {
        result = await window.launchpad.getSteamFriends({})
      } else {
        // Browser demo - matches real API shape exactly
        await new Promise(r => setTimeout(r, 700))
        result = { success: true, friends: DEMO_FRIENDS }
      }

      if (result.success) {
        setFriends(result.friends)
        const now = Date.now()
        setLastFetched(now)
        try {
          await window.storage.set(CACHE_KEY, JSON.stringify({ friends: result.friends, fetchedAt: now }))
        } catch(e) {}
      } else {
        setError(result.error || 'Failed to load friends')
      }
    } catch(e) { setError(e.message) }
    finally    { setLoading(false) }
  }, [lastFetched])

  useEffect(() => { fetchFriends() }, [])

  return { friends, loading, error, steamConnected, lastFetched, refetch: () => fetchFriends(true) }
}

// Demo data matches exact shape returned by steam-get-friends IPC handler
const DEMO_FRIENDS = [
  {
    steamid: 'd1', name: 'Vex_RSI', avatar: null, avatarInitial: 'V',
    color: '#00d4ff', isInGame: true, actionType: 'playing',
    gameName: 'Cyberpunk 2077',
    gameImgUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/library_600x900.jpg',
    action: 'is playing Cyberpunk 2077', personastate: 1, lastOnline: null,
  },
  {
    steamid: 'd2', name: 'Nora_R', avatar: null, avatarInitial: 'N',
    color: '#f43f5e', isInGame: true, actionType: 'playing',
    gameName: 'Elden Ring',
    gameImgUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900.jpg',
    action: 'is playing Elden Ring', personastate: 1, lastOnline: null,
  },
  {
    steamid: 'd3', name: 'ghostkey', avatar: null, avatarInitial: 'G',
    color: '#a855f7', isInGame: false, actionType: 'recent',
    gameName: 'Star Citizen', gameImgUrl: null,
    action: 'played Star Citizen recently', personastate: 3, lastOnline: Date.now() - 45 * 60000,
  },
  {
    steamid: 'd4', name: 'Solace77', avatar: null, avatarInitial: 'S',
    color: '#f59e0b', isInGame: false, actionType: 'recent',
    gameName: 'Red Dead Redemption 2',
    gameImgUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg',
    action: 'played RDR2 for 3h this week', personastate: 0, lastOnline: Date.now() - 4 * 3600000,
  },
  {
    steamid: 'd5', name: 'px7_grind', avatar: null, avatarInitial: 'P',
    color: '#10b981', isInGame: false, actionType: 'online',
    gameName: null, gameImgUrl: null,
    action: 'Online', personastate: 1, lastOnline: null,
  },
]
