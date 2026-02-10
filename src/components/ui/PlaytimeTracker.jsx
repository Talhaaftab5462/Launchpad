import React from 'react'
import Icon from './Icon'
import { C, RsiButton } from './RSI'

function pad(n) { return String(n).padStart(2, '0') }
export function formatElapsed(secs) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export default function PlaytimeTracker({ game, launcher, accent = C.accent }) {
  const running = launcher?.isRunning(game.id)
  const hasExe = !!game.executablePath
  const isElectronApp = typeof window.launchpad !== 'undefined'

  async function handlePlay() {
    const result = await launcher?.launch(game)
    if (!result?.success && result?.error) console.error('Launch failed:', result.error)
  }

  if (running) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.3)', padding: '8px 16px', clipPath: 'polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)', boxShadow: '0 0 16px rgba(0,229,160,0.1)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.success, boxShadow: `0 0 10px ${C.success}`, animation: 'glow-pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 16, fontWeight: 400, color: C.success, letterSpacing: '0.05em', textShadow: `0 0 12px ${C.success}88` }}>
          {formatElapsed(launcher.elapsed)}
        </span>
      </div>
      <RsiButton onClick={() => launcher?.stop(game.id)} variant="danger" size="sm">
        <Icon name="x" size={12} color="#fca5a5" /> STOP
      </RsiButton>
    </div>
  )

  return (
    <RsiButton
      onClick={handlePlay}
      variant="solid"
      size="lg"
      accent={accent}
      disabled={isElectronApp && !hasExe}
      style={{ opacity: isElectronApp && !hasExe ? 0.4 : 1 }}
    >
      <Icon name="play" size={16} color="#080c12" />
      {isElectronApp && !hasExe ? 'NO EXECUTABLE SET' : 'LAUNCH GAME'}
    </RsiButton>
  )
}
