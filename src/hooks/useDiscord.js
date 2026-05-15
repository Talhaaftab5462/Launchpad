import { useState, useEffect, useCallback, useRef } from 'react'

const isElectron = typeof window !== 'undefined' && typeof window.discordAPI !== 'undefined'

export function buildGameActivity(game, startTimestamp, showGame = true, showPlaytime = true) {
  const totalHours = Math.floor((game.playtime || 0) / 60)
  const totalMins  = (game.playtime || 0) % 60
  const playtimeStr = totalHours > 0
    ? `${totalHours}h ${totalMins}m played`
    : totalMins > 0 ? `${totalMins}m played` : 'New session'

  const cover = game.coverUrl?.startsWith('https://') ? game.coverUrl
              : game.backgroundUrl?.startsWith('https://') ? game.backgroundUrl
              : null

  return {
    details:        showGame ? game.title : 'In Game',
    state:          showPlaytime ? playtimeStr : 'Playing',
    startTimestamp,
    largeImageKey:  cover || 'launchpad_logo',
    largeImageText: game.title,
    smallImageKey:  'launchpad_logo',
    smallImageText: 'Launchpad',
    instance:       true,
  }
}

export function buildIdleActivity(games) {
  const total   = games.length
  const hours   = Math.floor(games.reduce((s, g) => s + (g.playtime || 0), 0) / 60)
  const backlog = games.filter(g => g.status === 'backlog').length
  return {
    details:       'Browsing Library',
    state:         `${total} games · ${hours}h played · ${backlog} in backlog`,
    largeImageKey: 'launchpad_logo',
    largeImageText:'Launchpad Game Launcher',
    instance:      false,
  }
}

export function useDiscord({ games = [], runningGame = null, launcher = null, settings = {} }) {
  const [connected,   setConnected]  = useState(false)
  const [noClientId,  setNoClientId] = useState(false)
  const [discordUser, setDiscordUser]= useState(null)

  // Refs so event listeners never have stale closures
  const gamesRef        = useRef(games)
  const runningRef      = useRef(runningGame)
  const launcherRef     = useRef(launcher)
  const connectedRef    = useRef(false)
  const enabledRef      = useRef(settings.discordRPC !== false)
  const showGameRef     = useRef(settings.discordShowGame !== false)
  const showPlaytimeRef = useRef(settings.discordShowPlaytime !== false)
  const prevGameId      = useRef(null)
  const prevClientId    = useRef(settings.discordClientId)
  const activityLock    = useRef(false)  // prevent concurrent pushes
  const mountedRef      = useRef(false)

  useEffect(() => { gamesRef.current        = games                            }, [games])
  useEffect(() => { runningRef.current      = runningGame                      }, [runningGame])
  useEffect(() => { launcherRef.current     = launcher                         }, [launcher])
  useEffect(() => { enabledRef.current      = settings.discordRPC !== false    }, [settings.discordRPC])
  useEffect(() => { showGameRef.current     = settings.discordShowGame !== false   }, [settings.discordShowGame])
  useEffect(() => { showPlaytimeRef.current = settings.discordShowPlaytime !== false }, [settings.discordShowPlaytime])

  // Single source of truth for pushing activity
  const pushActivity = useCallback((reason) => {
    if (!isElectron || !connectedRef.current || !enabledRef.current) return
    if (activityLock.current) return   // deduplicate rapid calls
    activityLock.current = true
    setTimeout(() => { activityLock.current = false }, 800)

    const game = runningRef.current
    const activity = game
      ? buildGameActivity(game, launcherRef.current?.startTime || Date.now(), showGameRef.current, showPlaytimeRef.current)
      : buildIdleActivity(gamesRef.current)
    console.log(`[Discord] Push (${reason}):`, activity.details, '|', activity.state)
    window.discordAPI.setActivity(activity).catch(e => console.warn('[Discord] setActivity:', e.message))
  }, [])

  useEffect(() => {
    if (!isElectron) return
    const enabled = settings.discordRPC !== false
    enabledRef.current = enabled
    if (enabled) {
      window.discordAPI.enable().then(r => {
        if (r?.error === 'no_client_id') setNoClientId(true)
      }).catch(() => {})
    } else {
      window.discordAPI.disable().catch(() => {})
      setConnected(false); connectedRef.current = false
    }
  }, [settings.discordRPC])  // only when the toggle changes

  useEffect(() => {
    if (!isElectron) return
    const newId = settings.discordClientId
    if (newId && newId !== '__SECURED__' && newId !== prevClientId.current) {
      prevClientId.current = newId
      setNoClientId(false)
      window.discordAPI.reconnect?.().catch(() => {})
    }
  }, [settings.discordClientId])

  useEffect(() => {
    if (!isElectron) return
    mountedRef.current = true

    const unsubConn = window.discordAPI.onConnected(d => {
      console.log('[Discord] Connected as', d?.username)
      connectedRef.current = true
      setConnected(true); setDiscordUser(d); setNoClientId(false)
      pushActivity('connected')
    })

    const unsubDisc = window.discordAPI.onDisconnected(() => {
      connectedRef.current = false
      setConnected(false); setDiscordUser(null)
    })

    // Initial status check - only push if already connected (no double-fire with onConnected)
    window.discordAPI.getStatus().then(s => {
      if (!mountedRef.current) return
      connectedRef.current = s.connected
      setConnected(s.connected)
      if (s.user) setDiscordUser(s.user)
      // Only push here if connected AND onConnected won't also fire (i.e. already was connected)
      if (s.connected) pushActivity('mount-status')
    }).catch(() => {})

    return () => {
      mountedRef.current = false
      unsubConn?.(); unsubDisc?.()
    }
  }, [pushActivity])

  useEffect(() => {
    if (!isElectron || !enabledRef.current || !mountedRef.current) return
    const newId = runningGame?.id || null
    const oldId = prevGameId.current
    prevGameId.current = newId
    if (!connectedRef.current) return
    if (newId !== oldId) pushActivity(newId ? 'game-start' : 'game-end')
  }, [runningGame?.id, pushActivity])

  useEffect(() => {
    if (!isElectron || !enabledRef.current || !connectedRef.current || runningGame) return
    const t = setTimeout(() => pushActivity('library-change'), 4000)
    return () => clearTimeout(t)
  }, [games.length, pushActivity])
  const reconnect = useCallback(async () => {
    if (!isElectron) return
    try {
      const r = await window.discordAPI.reconnect?.()
      if (r?.error === 'no_client_id') setNoClientId(true)
    } catch(e) {}
  }, [])

  return { connected, discordUser, noClientId, reconnect }
}