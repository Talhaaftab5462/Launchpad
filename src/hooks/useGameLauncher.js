import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Manages real-time game launch state.
 * - Tracks which game is running
 * - Shows live elapsed time
 * - Receives exit events from Electron main process
 * - Works in browser (no-op) and Electron
 */
export function useGameLauncher({ onSessionEnd, onError }) {
  const [runningGameId, setRunningGameId] = useState(null)
  const [elapsed, setElapsed] = useState(0)      // seconds
  const [startTime, setStartTime] = useState(null)
  const timerRef = useRef(null)
  const isElectron = typeof window.launchpad !== 'undefined'

  // Start elapsed timer
  const startTimer = useCallback((fromTime) => {
    const t = fromTime || Date.now()
    setStartTime(t)
    setElapsed(0)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - t) / 1000))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setElapsed(0)
    setStartTime(null)
    setRunningGameId(null)
  }, [])

  // Listen for Electron game events
  useEffect(() => {
    if (!isElectron) return
    const offStarted = window.launchpad.onGameStarted(({ gameId, startTime }) => {
      setRunningGameId(gameId)
      startTimer(startTime)
    })
    const offExited = window.launchpad.onGameExited(({ gameId, durationMins }) => {
      stopTimer()
      if (durationMins > 0 && onSessionEnd) onSessionEnd(gameId, durationMins)
    })
    const offError = window.launchpad.onGameError(({ gameId, error }) => {
      stopTimer()
      if (onError) onError(error)
    })
    // Sync running state on mount (in case app reloaded mid-session)
    window.launchpad.getRunning().then(ids => {
      if (ids.length > 0) { setRunningGameId(ids[0]); startTimer() }
    })
    return () => {
      offStarted?.(); offExited?.(); offError?.()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isElectron, onSessionEnd, onError, startTimer, stopTimer])

  const launch = useCallback(async (game) => {
    if (!isElectron) {
      // Browser demo mode - simulate with local timer
      setRunningGameId(game.id)
      startTimer()
      return { success: true }
    }
    if (!game.executablePath) return { success: false, error: 'No executable set' }
    const result = await window.launchpad.launchGame(game.id, game.executablePath)
    if (!result.success) return result
    return { success: true }
  }, [isElectron, startTimer])

  const stop = useCallback(async (gameId) => {
    if (!isElectron) {
      // Browser demo - simulate session end
      const mins = Math.max(1, Math.round(elapsed / 60))
      stopTimer()
      if (onSessionEnd) onSessionEnd(gameId, mins)
      return
    }
    await window.launchpad.stopGame(gameId)
  }, [isElectron, elapsed, stopTimer, onSessionEnd])

  return { runningGameId, elapsed, startTime, launch, stop, isRunning: (id) => runningGameId === id }
}
