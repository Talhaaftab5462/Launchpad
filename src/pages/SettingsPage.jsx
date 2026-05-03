import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import { C, Panel, SectionHeader, RsiButton, HexBadge } from '../components/ui/RSI'
import { useToast } from '../hooks/useToast'

const ACCENT_PRESETS = [
  { name: 'RSI Cyan',      value: '#00d4ff' },
  { name: 'Emerald',       value: '#00e5a0' },
  { name: 'Amber',         value: '#f59e0b' },
  { name: 'Violet',        value: '#a855f7' },
  { name: 'Rose',          value: '#f43f5e' },
  { name: 'Electric Blue', value: '#0a84ff' },
  { name: 'Orange',        value: '#f97316' },
  { name: 'Lime',          value: '#84cc16' },
]

const INP = {
  width: '100%', background: '#060e18', border: `1px solid ${C.border}`,
  color: C.text, padding: '8px 12px', fontSize: 12, outline: 'none',
  fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.04em',
  transition: 'border-color 0.15s',
}

function Section({ title, children, accent = C.accent }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader accent={accent} style={{ marginBottom: 12 }}>{title}</SectionHeader>
      <Panel style={{ overflow: 'hidden' }}>
        {children}
      </Panel>
    </div>
  )
}

function Row({ label, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '13px 16px', borderBottom: last ? 'none' : `1px solid ${C.border}`, gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: C.textBright }}>{label}</div>
        {desc && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginTop: 4, lineHeight: 1.5, letterSpacing: '0.02em' }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, maxWidth: 320, width: '100%' }}>{children}</div>
    </div>
  )
}

function Toggle({ value, onChange, accent = C.accent }) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 42, height: 22, background: value ? accent + '33' : C.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', border: `1px solid ${value ? accent + '66' : C.border}` }}>
      <div style={{ position: 'absolute', top: 2, left: value ? 21 : 2, width: 16, height: 16, background: value ? accent : C.textDim, transition: 'left 0.2s, background 0.2s', boxShadow: value ? `0 0 8px ${accent}` : 'none' }} />
    </div>
  )
}

function ApiField({ value, onChange, placeholder, type = 'text', helpText, linkText, linkUrl }) {
  const [show,    setShow]    = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')
  const isPass    = type === 'password'
  const isSecured = value === '__SECURED__'

  // If secured and not editing, show locked indicator
  if (isSecured && !editing) {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '8px 12px', background: '#060e18', border: `1px solid ${C.success}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.success, letterSpacing: '0.05em' }}>🔒 SAVED SECURELY</span>
            <button onClick={() => { setEditing(true); setDraft('') }}
              style={{ background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              CHANGE
            </button>
          </div>
          <div style={{ width: 7, height: 7, background: C.success, boxShadow: `0 0 6px ${C.success}`, flexShrink: 0 }} />
        </div>
        {helpText && <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginTop: 5, lineHeight: 1.5 }}>{helpText}</div>}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            autoFocus={editing}
            style={{ ...INP, paddingRight: isPass ? 46 : 12 }}
            type={isPass && !show ? 'password' : 'text'}
            value={editing ? draft : (value || '')}
            onChange={e => {
              if (editing) setDraft(e.target.value)
              else onChange(e.target.value)
            }}
            onBlur={() => {
              if (editing) {
                if (draft) onChange(draft)
                setEditing(false)
              }
            }}
            onKeyDown={e => {
              if (editing && e.key === 'Enter') { if (draft) onChange(draft); setEditing(false) }
              if (editing && e.key === 'Escape') { setEditing(false) }
            }}
            placeholder={placeholder}
            onFocus={e => e.target.style.borderColor = C.accent}
          />
          {isPass && (
            <button onClick={() => setShow(s => !s)}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textDim, cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {show ? 'HIDE' : 'SHOW'}
            </button>
          )}
        </div>
        {value && value !== '__SECURED__' && <div style={{ width: 7, height: 7, background: C.success, boxShadow: `0 0 6px ${C.success}`, flexShrink: 0 }} />}
      </div>
      {helpText && (
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, marginTop: 5, lineHeight: 1.5 }}>
          {helpText}{' '}
          {linkUrl && <a href={linkUrl} target="_blank" rel="noreferrer" style={{ color: C.accent, textDecoration: 'none' }}>{linkText}</a>}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage({ settings, onUpdate, onClearLibrary, accent = C.accent, discord = null, games = [] }) {
  const toast = useToast()
  const [customColor, setCustomColor] = useState(settings.accentColor || C.accent)
  const isElectron = typeof window.launchpad !== 'undefined'

  function handleClear() {
    if (!window.confirm('Permanently delete all games? This cannot be undone.')) return
    onClearLibrary()
    toast('Library cleared', 'info')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 20, overflow: 'auto', height: '100%', maxWidth: 700 }}>

      <SectionHeader accent={accent} style={{ marginBottom: 22 }}>Settings</SectionHeader>

      {/* API Keys */}
      <Section title="Game Database API Keys" accent={accent}>
        {/* Status indicators */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { name: 'Steam',  active: true,                                              note: 'Free · No key needed' },
            { name: 'RAWG',   active: !!settings.rawgApiKey,                             note: settings.rawgApiKey ? 'Key active' : 'Key required' },
            { name: 'IGDB',   active: !!(settings.igdbClientId && settings.igdbClientSecret), note: (settings.igdbClientId && settings.igdbClientSecret) ? 'Credentials active' : 'Credentials required' },
          ].map(({ name, active, note }) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 6, height: 6, background: active ? C.success : C.border, boxShadow: active ? `0 0 6px ${C.success}` : 'none' }} />
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: active ? C.text : C.textDim }}>{name}</span>
              <HexBadge color={active ? C.success : C.textDim} style={{ fontSize: 9 }}>{note}</HexBadge>
            </div>
          ))}
        </div>
        <Row label="RAWG API Key" desc="Rich metadata: cover art, descriptions, ratings, genres.">
          <ApiField value={settings.rawgApiKey} onChange={v => onUpdate('rawgApiKey', v)} placeholder="Paste key here" type="password" helpText="Free key at" linkText="rawg.io/apiv2" linkUrl="https://rawg.io/apiv2" />
        </Row>
        <Row label="IGDB Client ID" desc="Most complete game database. Requires Twitch Developer account.">
          <ApiField value={settings.igdbClientId} onChange={v => onUpdate('igdbClientId', v)} placeholder="Twitch Client ID" type="password" helpText="Get free credentials at" linkText="dev.twitch.tv/console" linkUrl="https://dev.twitch.tv/console/apps" />
        </Row>
        <Row label="IGDB Client Secret" desc="Secret paired with your Client ID." last>
          <ApiField value={settings.igdbClientSecret} onChange={v => onUpdate('igdbClientSecret', v)} placeholder="Twitch Client Secret" type="password" helpText="Twitch console → your app → New Secret" />
        </Row>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" accent={accent}>
        <Row label="Accent Color" desc="Primary highlight color used throughout the interface.">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {ACCENT_PRESETS.map(p => (
              <button key={p.value} title={p.name} onClick={() => { onUpdate('accentColor', p.value); setCustomColor(p.value); toast(`Accent: ${p.name}`, 'success') }}
                style={{ width: 22, height: 22, background: p.value, border: `2px solid ${settings.accentColor === p.value ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s', flexShrink: 0, boxShadow: settings.accentColor === p.value ? `0 0 8px ${p.value}` : 'none' }} />
            ))}
            <div style={{ position: 'relative' }}>
              <div style={{ width: 22, height: 22, background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', cursor: 'pointer', border: '2px solid #444', overflow: 'hidden' }}>
                <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); onUpdate('accentColor', e.target.value) }}
                  style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer' }} title="Custom color" />
              </div>
            </div>
          </div>
        </Row>
        <Row label="Layout Density" desc="Affects card size and padding in the library view.">
          <div style={{ display: 'flex', gap: 6 }}>
            {['comfortable','compact'].map(d => (
              <button key={d} onClick={() => { onUpdate('density', d); toast(`Density: ${d}`, 'success') }}
                style={{ padding: '5px 14px', background: settings.density === d ? `${accent}18` : 'transparent', border: `1px solid ${settings.density === d ? accent + '55' : C.border}`, color: settings.density === d ? accent : C.textDim, fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>
                {d.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Sidebar Collapsed on Start">
          <Toggle value={!!settings.sidebarCollapsed} onChange={v => onUpdate('sidebarCollapsed', v)} accent={accent} />
        </Row>
        <Row label="Background Art Blur" desc="Blur intensity for hero/detail background images (0 = sharp, 8 = heavy blur).">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <input type="range" min="0" max="8" step="1" value={settings.bgBlur ?? 3}
              onChange={e => onUpdate('bgBlur', Number(e.target.value))}
              style={{ flex:1, accentColor: accent, height:4, cursor:'pointer' }} />
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:accent, width:20, textAlign:'right' }}>{settings.bgBlur ?? 3}</span>
          </div>
        </Row>
        <Row label="Achievement Badges on Cards" desc="Show unlock progress badge on game cover art in the library." last>
          <Toggle value={settings.showAchBadges !== false} onChange={v => onUpdate('showAchBadges', v)} accent={accent} />
        </Row>
      </Section>

      {/* Library */}
      <Section title="Library" accent={accent}>
        <Row label="Default View" desc="View mode when opening the Library page.">
          <div style={{ display: 'flex', gap: 6 }}>
            {['grid','list'].map(v => (
              <button key={v} onClick={() => { onUpdate('defaultView', v); toast(`Default: ${v}`, 'success') }}
                style={{ padding: '5px 14px', background: settings.defaultView === v ? `${accent}18` : 'transparent', border: `1px solid ${settings.defaultView === v ? accent + '55' : C.border}`, color: settings.defaultView === v ? accent : C.textDim, fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.15s' }}>
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Show Playtime on Cards" last>
          <Toggle value={settings.showPlaytime !== false} onChange={v => onUpdate('showPlaytime', v)} accent={accent} />
        </Row>
      </Section>

      {/* Discord Integration */}
      <Section title="Discord Integration" accent="#5865f2">
        {/* Setup guide */}
        <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:'#5865f208' }}>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#5865f2', marginBottom:8 }}>SETUP GUIDE</div>
          {[
            ['1', 'discord.com/developers → New Application → name it "Launchpad"'],
            ['2', 'Copy the Application ID → paste it below as Client ID'],
            ['3', 'Rich Presence → Art Assets → Add Image → name it exactly: launchpad_logo'],
            ['4', 'Save, restart Launchpad - Done. No OAuth, no bot, no invite needed.'],
          ].map(([n, text]) => (
            <div key={n} style={{ display:'flex', gap:8, marginBottom:5, alignItems:'flex-start' }}>
              <div style={{ width:16, height:16, background:'#5865f222', border:'1px solid #5865f244', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif", fontSize:10, fontWeight:700, color:'#5865f2', flexShrink:0 }}>{n}</div>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:C.textDim, lineHeight:1.5 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Rich Presence status indicator */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: discord?.connected ? '#00e5a0' : discord?.noClientId ? '#f59e0b' : C.border,
            boxShadow: discord?.connected ? '0 0 8px #00e5a0' : discord?.noClientId ? '0 0 8px #f59e0b44' : 'none' }} />
          <div style={{ flex: 1 }}>
            {discord?.connected && discord?.discordUser ? (
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.text }}>
                Connected as <span style={{ color: '#5865f2', fontWeight: 700 }}>{discord?.discordUser?.username}</span>
              </div>
            ) : discord?.noClientId ? (
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: '#f59e0b' }}>
                ⚠ No Client ID - paste your Discord App ID below to activate
              </div>
            ) : settings.discordRPC !== false ? (
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim }}>
                Connecting… (Discord must be running)
              </div>
            ) : (
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.textDim }}>Rich Presence disabled</div>
            )}
          </div>
          {!discord?.connected && !discord?.noClientId && settings.discordRPC !== false && (
            <RsiButton onClick={() => discord?.reconnect?.()} variant="ghost" size="sm" accent="#5865f2">RETRY</RsiButton>
          )}
        </div>

        <Row label="Rich Presence" desc="Show current game, playtime, and library stats in your Discord status.">
          <Toggle value={settings.discordRPC !== false} onChange={v => onUpdate('discordRPC', v)} accent="#5865f2" />
        </Row>

        <Row label="Show Game Name" desc="Display the game title in your Discord status while playing.">
          <Toggle value={settings.discordShowGame !== false} onChange={v => onUpdate('discordShowGame', v)} accent="#5865f2" />
        </Row>

        <Row label="Show Playtime" desc="Show how long you've played a game in your Discord status.">
          <Toggle value={settings.discordShowPlaytime !== false} onChange={v => onUpdate('discordShowPlaytime', v)} accent="#5865f2" />
        </Row>

        {/* Discord App Client ID */}
        <Row label="Discord App Client ID" desc="Create a free app at discord.com/developers. Paste the Application ID here. For cover art to appear, upload an asset named 'launchpad_logo' under Rich Presence → Art Assets.">
          <ApiField
            value={settings.discordClientId}
            onChange={v => onUpdate('discordClientId', v)}
            placeholder="Your Discord App Client ID"
            helpText="Portal: New App → copy Application ID · Then: Rich Presence → Art Assets → upload 'launchpad_logo'"
            linkText="discord.com/developers"
            linkUrl="https://discord.com/developers/applications"
          />
        </Row>

        {/* Cloud Backup via Discord Webhook */}
        <Row label="Backup Webhook URL" desc="Paste a Discord webhook URL to back up and restore your library through Discord.">
          <ApiField
            value={settings.discordWebhook}
            onChange={v => onUpdate('discordWebhook', v)}
            placeholder="https://discord.com/api/webhooks/..."
            type="password"
            helpText="Discord channel → Edit → Integrations → Webhooks → New Webhook → Copy URL"
          />
        </Row>

        <Row label="Back Up Library Now" desc="Send an encrypted snapshot to your Discord webhook. Restoreable any time." last>
          <div style={{ display: 'flex', gap: 8 }}>
            <RsiButton variant="primary" size="sm" accent="#5865f2" onClick={async () => {
              if (!settings.discordWebhook) { toast('Set a Discord webhook URL first', 'error'); return }
              try {
                const r = await window.storage.get('launchpad_games_v2')
                const data = r?.value || '[]'
                const count = JSON.parse(data).length
                const result = await window.discordAPI.backupSave(settings.discordWebhook, data)
                if (result.success) toast(`Backed up ${count} games to Discord ✓`, 'success')
                else toast('Backup failed: ' + result.error, 'error')
              } catch(e) { toast('Backup error: ' + e.message, 'error') }
            }}>
              <Icon name="save" size={12} color="#5865f2" /> BACK UP NOW
            </RsiButton>
          </div>
        </Row>
      </Section>

      {/* Library Backup (encrypted file only - no raw JSON export) */}
      <Section title="Library Backup" accent={accent}>
        <Row label="Export Encrypted Backup" desc="Download a password-protected backup file. Your API keys are NOT included.">
          <RsiButton variant="ghost" size="sm" onClick={async () => {
            try {
              const r = await window.storage.get('launchpad_games_v2')
              const rawGames = r?.value ? JSON.parse(r.value) : []
              // Strip sensitive fields before export
              const safeGames = rawGames.map(g => {
                const { executablePath, ...safe } = g
                return safe
              })
              const exportData = {
                version: 1,
                exportedAt: new Date().toISOString(),
                gameCount: safeGames.length,
                games: safeGames,
              }
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url
              a.download = `launchpad-backup-${new Date().toISOString().split('T')[0]}.json`
              a.click(); URL.revokeObjectURL(url)
              toast(`Exported ${safeGames.length} games (exe paths excluded)`, 'success')
            } catch(err) { toast('Export failed', 'error') }
          }}>
            <Icon name="save" size={12} color={C.textDim} /> EXPORT BACKUP
          </RsiButton>
        </Row>
        <Row label="Restore from Backup" desc="Import a previously exported backup. Skips duplicate game IDs. Executable paths must be re-linked." last>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: 'transparent', border: `1px solid ${C.border}`, color: C.textDim, fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = accent + '55'}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
            <Icon name="plus" size={12} color={C.textDim} /> RESTORE BACKUP
            <input type="file" accept=".json" style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0]; if (!file) return
                try {
                  const text = await file.text()
                  const parsed = JSON.parse(text)
                  // Support both old format (array) and new format ({ games: [...] })
                  const imported = Array.isArray(parsed) ? parsed : parsed.games
                  if (!Array.isArray(imported)) { toast('Invalid backup file', 'error'); return }
                  const r = await window.storage.get('launchpad_games_v2')
                  const existing = r?.value ? JSON.parse(r.value) : []
                  const existingIds = new Set(existing.map(g => g.id))
                  const newGames = imported.filter(g => g.id && !existingIds.has(g.id))
                  await window.storage.set('launchpad_games_v2', JSON.stringify([...existing, ...newGames]))
                  toast(`Restored ${newGames.length} game${newGames.length !== 1 ? 's' : ''}. Reloading…`, 'success')
                  setTimeout(() => window.location.reload(), 1500)
                } catch(err) { toast('Restore failed: ' + err.message, 'error') }
                e.target.value = ''
              }} />
          </label>
        </Row>
      </Section>

      {/* Storage */}
      {isElectron && (
        <Section title="Storage" accent={accent}>
          <Row label="Data Location" desc="Your library is stored on disk and survives reinstalls." last>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, wordBreak: 'break-all' }}>
              %APPDATA%\launchpad-game-launcher\
            </div>
          </Row>
        </Section>
      )}

      {/* Shortcuts */}
      <Section title="Keyboard Shortcuts" accent={accent}>
        {[['Ctrl + K','Open command palette'],['Escape','Close modal / overlay'],['↑ ↓','Navigate palette'],['↵','Open selected game']].map(([key, desc], i, arr) => (
          <Row key={key} label={desc} last={i === arr.length - 1}>
            <kbd style={{ background: '#060e18', border: `1px solid ${C.border}`, padding: '3px 10px', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.text, letterSpacing: '0.04em' }}>{key}</kbd>
          </Row>
        ))}
      </Section>

      {/* Danger zone */}
      <Section title="Danger Zone" accent="#ef4444">
        <Row label="Clear Library" desc="Permanently removes all games, sessions, and playtime. Cannot be undone." last>
          <RsiButton onClick={handleClear} variant="danger" size="sm">
            <Icon name="trash" size={12} color="#fca5a5" /> CLEAR ALL GAMES
          </RsiButton>
        </Row>
      </Section>

      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: C.textDim, textAlign: 'center', paddingBottom: 8, letterSpacing: '0.1em' }}>
        LAUNCHPAD v1.0.1 // RSI EDITION
      </div>
    </motion.div>
  )
}
