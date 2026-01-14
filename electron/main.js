const { app, BrowserWindow, ipcMain, dialog, shell, Tray, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const https = require('https')
const http = require('http')
const url = require('url')

const isDev = !fs.existsSync(path.join(__dirname, '../dist/index.html'))

const storageFile   = path.join(app.getPath('userData'), 'launchpad-storage.json')
const storageBackup = path.join(app.getPath('userData'), 'launchpad-storage.backup.json')

function loadStorage() {
  for (const f of [storageFile, storageBackup]) {
    try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')) } catch(e) {}
  }
  return {}
}
function saveStorage(data) {
  try {
    const tmp = storageFile + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8')
    if (fs.existsSync(storageFile)) fs.copyFileSync(storageFile, storageBackup)
    fs.renameSync(tmp, storageFile)
  } catch(e) { console.error('[storage] Save error:', e.message) }
}

let store = loadStorage()
ipcMain.handle('storage-get', (_, k) => {
  const v = store[k]
  if (v === undefined) return null
  // Scrub any raw API key values that might have been stored before secure storage was in place
  if (k === 'launchpad_settings') {
    try {
      const parsed = JSON.parse(v)
      const SENSITIVE = ['rawgApiKey','igdbClientId','igdbClientSecret','discordWebhook','password']
      let scrubbed = false
      SENSITIVE.forEach(key => {
        if (parsed[key] && parsed[key] !== '__SECURED__' && parsed[key].length > 8) {
          parsed[key] = '__SECURED__'
          scrubbed = true
        }
      })
      if (scrubbed) {
        const clean = JSON.stringify(parsed)
        store[k] = clean
        saveStorage(store)
        return { key: k, value: clean }
      }
    } catch(e) {}
  }
  return { key: k, value: v }
})
ipcMain.handle('storage-set',    (_, k, v) => { store[k] = v; saveStorage(store); return { key: k, value: v } })
ipcMain.handle('storage-delete', (_, k)    => { delete store[k]; saveStorage(store); return { key: k, deleted: true } })
ipcMain.handle('storage-list',   (_, p)    => ({ keys: Object.keys(store).filter(k => !p || k.startsWith(p)) }))

// Uses discord-rpc package. Requires user to have Discord open.
const DISCORD_CLIENT_ID = '1234567890123456' // Replace with your Discord App client ID from discord.com/developers

let discordClient     = null
let discordEnabled    = false
let discordRetryTimer = null
let currentActivity   = null
let discordRetryCount = 0          // exponential backoff counter
let discordConnecting = false      // prevent concurrent login attempts

function getDiscordClientId() {
  // Always prefer the user-set client ID from settings
  try {
    const raw = store['launchpad_settings']
    if (raw) {
      const s = JSON.parse(raw)
      if (s.discordClientId && s.discordClientId.trim() && s.discordClientId !== '__SECURED__') {
        return s.discordClientId.trim()
      }
    }
  } catch(e) {}
  return null
}

function scheduleRetry() {
  if (!discordEnabled || !getDiscordClientId()) return
  if (discordRetryTimer) clearTimeout(discordRetryTimer)
  // Exponential backoff: 5s, 10s, 20s, 30s, 30s, 30s... (caps at 30s)
  // Short intervals so it reconnects quickly when user opens Discord
  const delays = [5000, 10000, 20000, 30000]
  const delay  = delays[Math.min(discordRetryCount, delays.length - 1)]
  discordRetryCount++
  console.log(`[Discord] Retry in ${delay/1000}s (attempt ${discordRetryCount})`)
  discordRetryTimer = setTimeout(connectDiscordRPC, delay)
}

async function connectDiscordRPC() {
  const clientId = getDiscordClientId()
  if (!clientId) {
    if (win) win.webContents.send('discord-rpc-no-client-id')
    return
  }
  // Prevent overlapping connection attempts
  if (discordClient || discordConnecting) return
  discordConnecting = true

  let DiscordRPC
  try { DiscordRPC = require('discord-rpc') }
  catch(e) {
    console.log('[Discord] discord-rpc not installed - run npm install')
    discordConnecting = false
    if (win) win.webContents.send('discord-disconnected')
    return
  }

  try {
    DiscordRPC.register(clientId)
    const rpc = new DiscordRPC.Client({ transport: 'ipc' })

    rpc.on('ready', () => {
      discordConnecting = false
      discordRetryCount = 0  // reset backoff on success
      console.log('[Discord] RPC connected as:', rpc.user?.username)
      discordClient = rpc
      if (win) win.webContents.send('discord-connected', {
        username: rpc.user?.username,
        avatar:   rpc.user?.avatar,
        id:       rpc.user?.id,
      })
      if (currentActivity) rpc.setActivity(currentActivity).catch(() => {})
    })

    rpc.on('disconnected', () => {
      console.log('[Discord] RPC disconnected')
      discordClient    = null
      discordConnecting= false
      if (win) win.webContents.send('discord-disconnected')
      scheduleRetry()
    })

    await rpc.login({ clientId })
  } catch(e) {
    discordClient     = null
    discordConnecting = false
    const isTimeout  = e.message?.includes('TIMEOUT') || e.message?.includes('timeout')
    const isFatal    = e.message?.includes('invalid_client') || e.message?.includes('Invalid')
    if (!isTimeout) console.log('[Discord] Connection error:', e.message)
    if (isFatal) {
      console.log('[Discord] Fatal error - check Client ID is correct')
      if (win) win.webContents.send('discord-rpc-invalid-client')
      return
    }
    scheduleRetry()
  }
}

ipcMain.handle('discord-enable', async () => {
  discordEnabled    = true
  discordRetryCount = 0
  if (discordRetryTimer) clearTimeout(discordRetryTimer)
  const clientId = getDiscordClientId()
  if (!clientId) return { success: false, error: 'no_client_id' }
  await connectDiscordRPC()
  return { success: true }
})

ipcMain.handle('discord-reconnect', async () => {
  if (discordConnecting) return { success: false, error: 'already_connecting' }
  if (discordClient) {
    try { await discordClient.clearActivity(); await discordClient.destroy() } catch(e) {}
    discordClient = null
  }
  if (discordRetryTimer) clearTimeout(discordRetryTimer)
  discordEnabled    = true
  discordRetryCount = 0
  discordConnecting = false
  const clientId = getDiscordClientId()
  if (!clientId) return { success: false, error: 'no_client_id' }
  await connectDiscordRPC()
  return { success: true }
})

ipcMain.handle('discord-disable', async () => {
  discordEnabled = false
  if (discordRetryTimer) clearTimeout(discordRetryTimer)
  if (discordClient) {
    try { await discordClient.clearActivity(); await discordClient.destroy() } catch(e) {}
    discordClient = null
  }
  if (win) win.webContents.send('discord-disconnected')
  return { success: true }
})

ipcMain.handle('discord-set-activity', async (_, activity) => {
  // If no cover URL, try to resolve one via Steam CDN using appid hint
  if (!activity.largeImageKey || activity.largeImageKey === 'launchpad_logo') {
    const title = activity.details
    if (title) {
      // Try searching Steam for this game to get cover art
      try {
        const searchRes = await httpGet(
          `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`,
          {}, 4000
        )
        const items = searchRes.data?.items || []
        if (items.length > 0) {
          const appid = items[0].id
          const coverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`
          activity = { ...activity, largeImageKey: coverUrl, largeImageText: title, smallImageKey: 'launchpad_logo', smallImageText: 'Launchpad' }
        }
      } catch(e) {}
    }
  }

  currentActivity = activity
  if (discordClient) {
    try {
      await discordClient.setActivity(activity)
      console.log('[Discord] Activity set:', activity.details, '|', activity.state)
      return { success: true }
    }
    catch(e) {
      console.warn('[Discord] setActivity error:', e.message)
      // If URL-based image failed, fall back to registered asset only
      if (e.message?.includes('image') || e.message?.includes('asset')) {
        try {
          const fallback = { ...activity, largeImageKey: 'launchpad_logo', smallImageKey: undefined, smallImageText: undefined }
          await discordClient.setActivity(fallback)
          currentActivity = fallback
          return { success: true }
        } catch(e2) {}
      }
      return { success: false, error: e.message }
    }
  }
  console.log('[Discord] Not connected - activity queued:', activity.details)
  return { success: false, error: 'Discord not connected - activity queued' }
})

ipcMain.handle('discord-clear-activity', async () => {
  currentActivity = null
  if (discordClient) {
    try { await discordClient.clearActivity(); return { success: true } }
    catch(e) { return { success: false, error: e.message } }
  }
  return { success: false, error: 'Discord not connected' }
})

ipcMain.handle('discord-get-status', () => ({
  connected: !!discordClient,
  enabled: discordEnabled,
  user: discordClient ? { username: discordClient.user?.username, id: discordClient.user?.id } : null,
}))

// Stores library snapshots as Discord messages in a private DM channel via bot token.

ipcMain.handle('discord-backup-save', async (_, { webhookUrl, data }) => {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return { success: false, error: 'Invalid Discord webhook URL. Must start with https://discord.com/api/webhooks/' }
  }
  try {
    const games     = JSON.parse(data)
    const dateStr   = new Date().toISOString().split('T')[0]
    const filename  = `launchpad-backup-${dateStr}.json`
    const fileData  = Buffer.from(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), gameCount: games.length, games }, null, 2))

    const BOUNDARY  = '----LaunchpadBoundary' + Date.now()
    const metadata  = JSON.stringify({
      username: 'Launchpad Backup',
      content:  '',
      embeds: [{
        title:       '📦 Library Backup',
        description: `**${games.length} games** backed up on ${dateStr}`,
        color:       0x3b82f6,
        fields: [
          { name: 'Total Games', value: String(games.length), inline: true },
          { name: 'Date',        value: dateStr,               inline: true },
        ],
        footer:    { text: 'Launchpad Game Launcher - restore via Settings → Restore Backup' },
        timestamp: new Date().toISOString(),
      }],
    })

    // Build multipart body manually (no external deps)
    const parts = [
      Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="payload_json"\r\nContent-Type: application/json\r\n\r\n`),
      Buffer.from(metadata),
      Buffer.from(`\r\n--${BOUNDARY}\r\nContent-Disposition: form-data; name="files[0]"; filename="${filename}"\r\nContent-Type: application/json\r\n\r\n`),
      fileData,
      Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
    ]
    const body = Buffer.concat(parts)

    const u       = new URL(webhookUrl)
    const isHttps = webhookUrl.startsWith('https')
    const lib     = isHttps ? https : http

    const result = await new Promise((resolve, reject) => {
      const req = lib.request({
        hostname: u.hostname,
        port:     u.port || (isHttps ? 443 : 80),
        path:     u.pathname + u.search + '?wait=true',
        method:   'POST',
        headers:  {
          'Content-Type':   `multipart/form-data; boundary=${BOUNDARY}`,
          'Content-Length': body.length,
          'User-Agent':     'Launchpad/2.0',
        },
      }, res => {
        let d = ''
        res.on('data', c => d += c)
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(d) }) }
          catch { resolve({ status: res.statusCode, data: null, raw: d }) }
        })
      })
      req.on('error', reject)
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')) })
      req.write(body)
      req.end()
    })

    if (result.status >= 200 && result.status < 300) {
      return { success: true, messageId: result.data?.id }
    }
    // Discord returns 400 with details on what went wrong
    const errMsg = result.data?.message || result.data?.error || `HTTP ${result.status}`
    return { success: false, error: `Discord: ${errMsg}` }
  } catch(e) { return { success: false, error: e.message } }
})

// Keys are encrypted at rest using OS-level encryption.
// We store a mapping of { keyName -> encryptedValue } in a separate secure file.
const secureFile = path.join(app.getPath('userData'), 'launchpad-secure.bin')

function loadSecure() {
  try {
    if (!fs.existsSync(secureFile)) return {}
    const raw = fs.readFileSync(secureFile)
    // File contains JSON of { key: base64EncodedEncryptedBuffer }
    return JSON.parse(raw.toString('utf8'))
  } catch(e) { return {} }
}

function saveSecure(data) {
  try { fs.writeFileSync(secureFile, JSON.stringify(data), 'utf8') } catch(e) {}
}

ipcMain.handle('secure-set', async (_, key, value) => {
  try {
    const { safeStorage } = require('electron')
    if (!safeStorage.isEncryptionAvailable()) {
      store[`__secure__${key}`] = value
      saveStorage(store)
      return { success: true, encrypted: false }
    }
    const encrypted = safeStorage.encryptString(value)
    const secure = loadSecure()
    secure[key] = encrypted.toString('base64')
    saveSecure(secure)
    return { success: true, encrypted: true }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('secure-get', async (_, key) => {
  try {
    const { safeStorage } = require('electron')
    if (!safeStorage.isEncryptionAvailable()) {
      const val = store[`__secure__${key}`]
      return val ? { success: true, value: val } : { success: false }
    }
    const secure = loadSecure()
    if (!secure[key]) return { success: false }
    const buf = Buffer.from(secure[key], 'base64')
    const decrypted = safeStorage.decryptString(buf)
    return { success: true, value: decrypted }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('secure-delete', async (_, key) => {
  try {
    const secure = loadSecure()
    delete secure[key]
    saveSecure(secure)
    delete store[`__secure__${key}`]
    saveStorage(store)
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})


function httpGet(url, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, { headers: { 'User-Agent': 'Launchpad/2.0', ...headers } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return httpGet(res.headers.location, headers, timeoutMs).then(resolve).catch(reject)
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body), raw: body }) }
        catch { resolve({ status: res.statusCode, data: null, raw: body }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function httpPost(urlStr, body, headers = {}, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr)
    const isJson = headers['Content-Type'] === 'application/json'
    const postBody = isJson ? body : body
    const options = {
      hostname: u.hostname, port: u.port || (urlStr.startsWith('https') ? 443 : 80),
      path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Launchpad/2.0', 'Content-Length': Buffer.byteLength(postBody), ...headers }
    }
    const lib = urlStr.startsWith('https') ? https : http
    const req = lib.request(options, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, data: null, raw: data }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(postBody)
    req.end()
  })
}


ipcMain.handle('platform-connect-steam', async (_, { apiKey, steamId }) => {
  if (!apiKey || !steamId) return { success: false, error: 'Steam Web API key and SteamID64 are required' }
  try {
    // Validate API key + SteamID by fetching player summary
    const cleanId = steamId.trim()
    const res = await httpGet(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${cleanId}`
    )
    if (res.status === 403) return { success: false, error: 'Invalid Steam Web API key' }
    if (!res.data?.response?.players?.length) return { success: false, error: 'SteamID not found - check your SteamID64' }
    const player = res.data.response.players[0]

    // Fetch owned games
    const gamesRes = await httpGet(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${cleanId}&include_appinfo=true&include_played_free_games=true`
    )
    const games = gamesRes.data?.response?.games || []

    // Save Steam creds to secure storage so we can use them server-side
    try {
      const { safeStorage } = require('electron')
      if (safeStorage.isEncryptionAvailable()) {
        const sec = loadSecure()
        sec['steamApiKey'] = safeStorage.encryptString(JSON.stringify({ apiKey, steamId: cleanId })).toString('base64')
        saveSecure(sec)
      }
    } catch(e) {}

    // Sort by most played first, cap at 150
    const sorted = [...games].sort((a, b) => (b.playtime_forever||0) - (a.playtime_forever||0)).slice(0, 150)

    const TOP_N = 20
    const topGames   = sorted.slice(0, TOP_N)
    const restGames  = sorted.slice(TOP_N)

    const detailResults = await Promise.allSettled(
      topGames.map(g => getSteamDetails(g.appid).catch(() => null))
    )

    const mapped = sorted.map((g, i) => {
      const detail = i < TOP_N ? (detailResults[i].status === 'fulfilled' ? detailResults[i].value : null) : null
      const baseUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${g.appid}`
      return {
        title:       detail?.title       || g.name,
        platform:    'steam',
        steamAppId:  g.appid,
        coverUrl:    `${baseUrl}/library_600x900.jpg`,
        backgroundUrl: detail?.backgroundUrl || `${baseUrl}/library_hero.jpg`,
        playtime:    Math.round(g.playtime_forever || 0),
        lastPlayed:  g.rtime_last_played ? new Date(g.rtime_last_played * 1000).toISOString() : null,
        status:      (g.playtime_forever || 0) > 0 ? 'playing' : 'backlog',
        description: detail?.description || '',
        genre:       detail?.genre       || [],
        developer:   detail?.developer   || '',
        publisher:   detail?.publisher   || '',
        releaseYear: detail?.releaseYear || null,
        rating:      detail?.rating      || 0,
        tags:        detail?.tags        || [],
        notes:       '',
      }
    })

    return {
      success:    true,
      profile:    { name: player.personaname, avatar: player.avatarmedium, steamId: cleanId },
      gameCount:  games.length,
      games:      mapped,
      enrichedCount: TOP_N,
    }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('steam-get-friends', async (_) => {
  let apiKey, steamId
  // Always prefer keys from secure storage
  try {
    const { safeStorage } = require('electron')
    const sec = loadSecure()
    if (safeStorage.isEncryptionAvailable() && sec['steamApiKey']) {
      const decrypted = JSON.parse(safeStorage.decryptString(Buffer.from(sec['steamApiKey'], 'base64')))
      apiKey  = decrypted.apiKey  || apiKey
      steamId = decrypted.steamId || steamId
    }
  } catch(e) {}
  if (!apiKey || !steamId) return { success: false, error: 'Steam API key and SteamID required' }
  try {
    // 1. Get friend list
    const friendsRes = await httpGet(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${apiKey}&steamid=${steamId}&relationship=friend`
    )
    if (friendsRes.status === 401 || friendsRes.status === 403) return { success: false, error: 'Steam API key invalid or profile is private' }
    
    const friendIds = (friendsRes.data?.friendslist?.friends || [])
      .sort((a, b) => b.friend_since - a.friend_since)
      .slice(0, 20) // cap at 20 friends to avoid rate limits
      .map(f => f.steamid)

    if (!friendIds.length) return { success: true, friends: [] }

    // 2. Get player summaries (name, avatar, online status, current game)
    const summaryRes = await httpGet(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${friendIds.join(',')}`
    )
    const players = summaryRes.data?.response?.players || []

    // 3. For each online/recently-active friend, get recently played games
    // Steam API: personastate 1=online, 3=away, 4=snooze, 2=busy
    const onlineFriends = players.filter(p => p.personastate > 0 || p.gameextrainfo)
    
    // Batch recent games for up to 8 friends (avoid too many requests)
    const recentGamesMap = {}
    await Promise.allSettled(
      onlineFriends.slice(0, 8).map(async p => {
        try {
          const r = await httpGet(
            `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${p.steamid}&count=1`
          )
          const games = r.data?.response?.games || []
          if (games.length) recentGamesMap[p.steamid] = games[0]
        } catch(e) {}
      })
    )

    // 4. Build activity entries
    const STATUS_LABELS = { 0:'Offline', 1:'Online', 2:'Busy', 3:'Away', 4:'Snooze', 5:'Looking to trade', 6:'Looking to play' }
    
    const friends = players
      .filter(p => {
        // Only show friends that are online, or have recent game activity
        return p.personastate > 0 || p.gameextrainfo || recentGamesMap[p.steamid]
      })
      .map(p => {
        const recentGame = recentGamesMap[p.steamid]
        const isInGame   = !!p.gameextrainfo
        const gameName   = p.gameextrainfo || recentGame?.name || null

        // Image: for in-game friends use the CURRENT game (p.gameid), not recently played
        // For offline/online friends use their most recently played game image
        const imageAppId = isInGame ? p.gameid : recentGame?.appid
        const gameImgUrl = imageAppId
          ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${imageAppId}/library_600x900.jpg`
          : null

        // Determine action text
        let action = ''
        let actionType = 'online' // 'playing' | 'recent' | 'online' | 'achievement'
        if (isInGame) {
          action = `is playing ${gameName}`
          actionType = 'playing'
        } else if (recentGame) {
          const mins = recentGame.playtime_2weeks || 0
          action = mins > 60
            ? `played ${gameName} for ${Math.floor(mins/60)}h ${mins%60}m this week`
            : `played ${gameName} recently`
          actionType = 'recent'
        } else {
          action = STATUS_LABELS[p.personastate] || 'Online'
          actionType = 'online'
        }

        // Generate a deterministic color from steamid
        const hue = parseInt(p.steamid.slice(-4), 16) % 360
        const color = `hsl(${hue}, 70%, 60%)`

        return {
          steamid: p.steamid,
          name: p.personaname,
          avatar: p.avatarmedium || p.avatar,
          avatarInitial: p.personaname?.[0]?.toUpperCase() || '?',
          color,
          isInGame,
          gameName,
          gameImgUrl,
          action,
          actionType,
          personastate: p.personastate,
          profileUrl: p.profileurl,
          lastOnline: p.lastlogoff ? p.lastlogoff * 1000 : null,
        }
      })
      // Sort: in-game first, then online, then recent
      .sort((a, b) => {
        if (a.isInGame && !b.isInGame) return -1
        if (!a.isInGame && b.isInGame) return 1
        if (a.personastate > 0 && b.personastate === 0) return -1
        if (a.personastate === 0 && b.personastate > 0) return 1
        return 0
      })

    return { success: true, friends }
  } catch(e) {
    return { success: false, error: e.message }
  }
})


ipcMain.handle('platform-connect-gog', async (event) => {
  const GOG_CLIENT_ID = '46899977096215655'
  const REDIRECT = 'https://embed.gog.com/on_login_success?origin=client'
  const authUrl = `https://auth.gog.com/auth?client_id=${GOG_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&layout=client2`

  return new Promise((resolve) => {
    const authWin = new BrowserWindow({
      width: 520, height: 680, parent: win,
      title: 'Sign in to GOG',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    authWin.loadURL(authUrl)

    authWin.webContents.on('will-navigate', async (e, navUrl) => {
      if (navUrl.includes('on_login_success') || navUrl.includes('code=')) {
        const parsed = new URL(navUrl)
        const code = parsed.searchParams.get('code')
        authWin.close()
        if (!code) { resolve({ success: false, error: 'No auth code returned' }); return }
        try {
          const tokenRes = await httpPost(
            'https://auth.gog.com/token',
            `client_id=${GOG_CLIENT_ID}&client_secret=46899977096215655secret&grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(REDIRECT)}`
          )
          if (tokenRes.data?.access_token) {
            resolve({ success: true, token: tokenRes.data.access_token, profile: { name: 'GOG User' } })
          } else {
            resolve({ success: false, error: 'Token exchange failed' })
          }
        } catch(err) { resolve({ success: false, error: err.message }) }
      }
    })
    authWin.on('closed', () => resolve({ success: false, error: 'Window closed' }))
  })
})

ipcMain.handle('platform-connect-epic', async (_, { clientId, clientSecret }) => {
  if (!clientId || !clientSecret) return { success: false, error: 'Epic client credentials required' }
  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await httpPost(
      'https://api.epicgames.dev/epic/oauth/v2/token',
      'grant_type=client_credentials',
      { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    )
    if (res.status !== 200 || !res.data?.access_token) {
      return { success: false, error: res.data?.errorMessage || `HTTP ${res.status} - check your Client ID and Secret` }
    }
    return { success: true, token: res.data.access_token, profile: { name: 'Epic Account' } }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('platform-connect-itchio', async (_, { apiKey }) => {
  if (!apiKey) return { success: false, error: 'itch.io API key is required' }
  try {
    const res = await httpGet('https://itch.io/api/1/' + apiKey + '/me')
    if (res.status !== 200 || !res.data?.user) return { success: false, error: 'Invalid itch.io API key' }
    const user = res.data.user

    const gamesRes = await httpGet('https://itch.io/api/1/' + apiKey + '/my-owned-keys?page=1')
    const keys = gamesRes.data?.owned_keys || []

    return {
      success: true,
      profile: { name: user.display_name || user.username, avatar: user.cover_url },
      gameCount: keys.length,
      games: keys.slice(0, 30).map(k => ({
        title: k.game?.title || 'Unknown',
        platform: 'itchio',
        coverUrl: k.game?.cover_url || '',
        backgroundUrl: k.game?.still_cover_url || k.game?.cover_url || '',
        status: 'backlog', genre: [], developer: k.game?.user?.display_name || '', publisher: '', description: k.game?.short_text || '', tags: [], notes: '',
      }))
    }
  } catch(e) { return { success: false, error: e.message } }
})

ipcMain.handle('platform-connect-xbox', async () => {
  const CLIENT_ID = '00000000441cc96b' // Xbox Live public client ID
  const REDIRECT  = 'https://login.live.com/oauth20_desktop.srf'
  const authUrl   = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&scope=Xboxlive.signin+Xboxlive.offline_access&display=touch&locale=en`

  return new Promise((resolve) => {
    const authWin = new BrowserWindow({
      width: 520, height: 680, parent: win,
      title: 'Sign in to Microsoft / Xbox',
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    authWin.loadURL(authUrl)

    authWin.webContents.on('will-redirect', async (e, navUrl) => {
      if (navUrl.startsWith(REDIRECT) && navUrl.includes('code=')) {
        const parsed = new URL(navUrl)
        const code = parsed.searchParams.get('code')
        authWin.close()
        if (code) {
          resolve({ success: true, profile: { name: 'Xbox / Game Pass' }, gameCount: 0, games: [], note: 'Connected - game library sync requires additional setup' })
        } else {
          resolve({ success: false, error: 'Auth cancelled or failed' })
        }
      }
    })
    authWin.on('closed', () => resolve({ success: false, error: 'Window closed' }))
  })
})

ipcMain.handle('platform-connect-battle', async (_, { clientId, clientSecret }) => {
  if (!clientId || !clientSecret) return { success: false, error: 'Blizzard OAuth credentials required. Create an app at develop.battle.net' }
  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await httpPost(
      'https://oauth.battle.net/token',
      'grant_type=client_credentials',
      { 'Authorization': `Basic ${creds}` }
    )
    if (!res.data?.access_token) return { success: false, error: 'Invalid Blizzard credentials - check develop.battle.net' }
    return { success: true, token: res.data.access_token, profile: { name: 'Battle.net Account' } }
  } catch(e) { return { success: false, error: e.message } }
})

// Extracts RSI handle + display name from login/MFA response data,
// then optionally enriches via RSI's public citizen-profile endpoint.
// Returns { handle, displayName, avatar } or null.

function extractRSIProfileFromResponse(d) {
  // Walk every possible location RSI has placed account info across API versions
  const candidates = [
    d?.data?.account_info,
    d?.data?.citizen,
    d?.data?.user,
    d?.data?.profile,
    d?.account_info,
    d?.citizen,
    d?.user,
  ].filter(Boolean)

  for (const info of candidates) {
    // nickname = display name users set
    // moniker = another display field
    const handle = info.handle || info.moniker || info.nickname || null
    const display = info.display_name || info.displayName || info.nickname || info.moniker || null
    const avatarPath = info.image || info.avatar || info.avatar_url || null
    const avatar = avatarPath
      ? (avatarPath.startsWith('http') ? avatarPath : `https://robertsspaceindustries.com${avatarPath}`)
      : null
    // Only return if we got something useful (not just numbers/email fragments)
    if (handle && !/^\d+$/.test(handle) && !handle.includes('@')) {
      return { handle, displayName: display || handle, avatar }
    }
  }
  return null
}

async function fetchRSIProfilePublic(handle) {
  if (!handle) return null
  try {
    // Returns JSON with the citizen's public profile data
    const safeHandle = handle.replace(/[^a-zA-Z0-9_\-]/g, '')
    const res = await httpPost(
      'https://robertsspaceindustries.com/graphql',
      JSON.stringify({
        query: `{ citizen(handle: "${safeHandle}") { handle, moniker, bio, enlisted, org { name, sid } } }`
      }),
      { 'Content-Type': 'application/json', 'Origin': 'https://robertsspaceindustries.com' },
      6000
    )
    const citizen = res.data?.data?.citizen
    if (citizen?.handle) {
      return { handle: citizen.handle, displayName: citizen.moniker || citizen.handle, avatar: null }
    }
  } catch(e) {}

  try {
    const res = await httpGet(
      `https://robertsspaceindustries.com/api/spectrum/search/member/autocomplete?community_id=1&text=${encodeURIComponent(handle)}&pagesize=1`,
      { 'Origin': 'https://robertsspaceindustries.com' },
      5000
    )
    const members = res.data?.data?.members || []
    const match = members.find(m => m.handle?.toLowerCase() === handle.toLowerCase())
    if (match) return { handle: match.handle, displayName: match.moniker || match.handle, avatar: match.image || null }
  } catch(e) {}

  return null
}

async function fetchRSIProfile(sessionToken, rawHandle) {
  // Step 1: Try authenticated account API with the session token
  const authHeaders = {
    'Origin':          'https://robertsspaceindustries.com',
    'Referer':         'https://robertsspaceindustries.com/',
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'X-Requested-With':'XMLHttpRequest',
    'Content-Type':    'application/json',
    ...(sessionToken ? { 'X-Rsi-Token': sessionToken } : {}),
  }

  const authEndpoints = [
    'https://robertsspaceindustries.com/api/launcher/v3/userInfo',
    'https://robertsspaceindustries.com/api/account/v2/getCurrentUser',
  ]

  for (const url of authEndpoints) {
    try {
      const res = await httpGet(url, authHeaders, 6000)
      const d   = res.data
      if (!d) continue
      console.log('[RSI Profile] Fetching from', url.split('/').slice(-3).join('/'))
      const extracted = extractRSIProfileFromResponse(d)
      if (extracted) {
        console.log('[RSI Profile] Got handle via auth:', extracted.handle)
        return extracted
      }
    } catch(e) {}
  }

  // Step 2: If we already have a raw handle from the response, use public lookup
  if (rawHandle && !rawHandle.includes('@') && !/^\d+$/.test(rawHandle)) {
    console.log('[RSI Profile] Using raw handle from response:', rawHandle)
    const pub = await fetchRSIProfilePublic(rawHandle)
    if (pub) return pub
    return { handle: rawHandle, displayName: rawHandle, avatar: null }
  }

  console.log('[RSI Profile] All profile fetch methods failed')
  return null
}

// Error code reference: 1035 = MFA required, 1012 = bad credentials, 1021 = account locked
ipcMain.handle('platform-connect-rsi', async (_, { email, password }) => {
  if (!email || !password) return { success: false, error: 'RSI email and password required' }
  try {
    const loginRes = await httpPost(
      'https://robertsspaceindustries.com/api/launcher/v3/signin',
      JSON.stringify({ username: email, password }),
      {
        'Content-Type': 'application/json',
        'Origin': 'https://robertsspaceindustries.com',
        'Referer': 'https://robertsspaceindustries.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      }
    )

    const d = loginRes.data
    if (!d) return { success: false, error: `RSI server returned no data (HTTP ${loginRes.status})` }

    // The session/claims token needed for the MFA step lives in data.claims or data.session_id
    const code = d.code || d.data?.code
    const isMFA = code === 1035 || d.data?.must_confirm ||
                  (typeof d.msg === 'string' && d.msg.toLowerCase().includes('multi-factor')) ||
                  (typeof d.msg === 'string' && d.msg.toLowerCase().includes('multifactor'))
    if (isMFA) {
      const sessionId = d.data?.claims      ||   // current RSI API field name
                        d.data?.session_id  ||
                        d.data?.sessionId   ||
                        d.data?.token       ||
                        d.claims            ||
                        d.session_id        ||
                        null
      console.log('[RSI] MFA required. Session token:', sessionId ? 'found' : 'NOT FOUND', '| Raw data keys:', Object.keys(d.data || d).join(','))
      return { success: false, requiresMFA: true, sessionId, email, error: 'MFA required' }
    }

    if (code === 1012 || code === 1013) return { success: false, error: 'Invalid email or password' }
    if (code === 1021) return { success: false, error: 'Account locked - too many failed attempts' }

    if ((d.success === 1 || loginRes.status === 200) && d.data?.account_info) {
      const info        = d.data.account_info
      const rawHandle   = info.handle || info.nickname || info.username || null
      const rawDisplay  = info.display_name || info.displayName || null
      const sessionTok  = d.data?.session_id || d.data?.claims || d.data?.token || null
      const fetched     = await fetchRSIProfile(sessionTok, rawHandle)
      const handle      = fetched?.handle      || rawHandle   || null
      const displayName = fetched?.displayName || rawDisplay  || handle || email.split('@')[0]
      const avatar      = fetched?.avatar      || info.image  || info.avatar || null
      return {
        success: true,
        profile: { name: displayName, handle, avatar, rsiHandle: handle },
        games: RSI_GAMES_CATALOG,
      }
    }

    const msg = d.msg || d.message || d.error || `HTTP ${loginRes.status}`
    return { success: false, error: `RSI login failed: ${msg}` }
  } catch(e) {
    return { success: false, error: `Connection failed: ${e.message}. Check your network or try again.` }
  }
})

const RSI_GAMES_CATALOG = [
  { title: 'Star Citizen', platform: 'rsi', coverUrl: 'https://robertsspaceindustries.com/media/z2vo2a913vja6r/store_small/Star-Citizen-Box-Art.jpg', backgroundUrl: 'https://robertsspaceindustries.com/media/b9vg6s1dsbpvfr/source/StarCitizen_Wallpaper_3840x2160.jpg', status: 'playing', genre: ['Space Sim', 'FPS', 'MMO'], developer: 'Cloud Imperium Games', publisher: 'Cloud Imperium Games', releaseYear: 2013, description: 'An ambitious space simulation MMO with unprecedented detail.', playtime: 0, tags: ['space', 'mmo', 'sci-fi'], notes: '' },
  { title: 'Squadron 42', platform: 'rsi', coverUrl: 'https://robertsspaceindustries.com/media/f3miphsxt7gtr/store_small/SQ42_Box_Art_2024.jpg', backgroundUrl: '', status: 'backlog', genre: ['Space Sim', 'FPS', 'Story'], developer: 'Cloud Imperium Games', publisher: 'Cloud Imperium Games', releaseYear: null, description: 'A single-player space combat campaign set in the Star Citizen universe.', playtime: 0, tags: ['space', 'campaign', 'sci-fi'], notes: '' },
]

// The session token from the initial login must be passed via cookies or headers
ipcMain.handle('platform-connect-rsi-mfa', async (_, { code, sessionId, email }) => {
  const cleanCode = String(code).trim().toUpperCase()

  const endpoints = [
    // Current RSI launcher API (as of 2024-2025)
    {
      url: 'https://robertsspaceindustries.com/api/launcher/v3/signin/multiStep',
      body: JSON.stringify({ code: cleanCode, claims: sessionId || '' }),
    },
    // Older variant with different casing
    {
      url: 'https://robertsspaceindustries.com/api/launcher/v3/signin/multistep',
      body: JSON.stringify({ code: cleanCode, sid: sessionId || '' }),
    },
    // Web-based MFA endpoint (used by RSI website login)
    {
      url: 'https://robertsspaceindustries.com/api/account/v2/setAuthToken',
      body: JSON.stringify({ code: cleanCode }),
    },
  ]

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://robertsspaceindustries.com',
    'Referer': 'https://robertsspaceindustries.com/connect/signin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/plain, */*',
    ...(sessionId ? { 'X-Rsi-Token': sessionId } : {}),
  }

  for (const endpoint of endpoints) {
    try {
      console.log('[RSI MFA] Trying endpoint:', endpoint.url.split('/').slice(-2).join('/'))
      const res = await httpPost(endpoint.url, endpoint.body, headers)
      const d = res.data
      // Log status only, not sensitive token data
      console.log('[RSI MFA] Response status:', res.status, '| success:', d?.success, '| has_account_info:', !!d?.data?.account_info)
      if (d?.data?.account_info) console.log('[RSI MFA] account_info keys:', Object.keys(d.data.account_info).join(','))

      // ErrInvalidApiMethod = wrong endpoint, skip to next
      if (d?.code === 'ErrInvalidApiMethod' || d?.msg === 'ErrInvalidApiMethod' ||
          (typeof d?.msg === 'string' && d.msg.includes('InvalidApiMethod'))) {
        console.log('[RSI MFA] Endpoint rejected (InvalidApiMethod), trying next...')
        continue
      }

      if (!d) continue

      const isSuccess = (
        d.data?.account_info ||
        d.success === 1 ||
        (res.status === 200 && (d.data?.session_id || d.data?.claims || d.data?.token))
      )
      if (isSuccess) {
        const token     = d.data?.session_id || d.data?.claims || d.data?.token || sessionId
        const rawInfo   = d.data?.account_info || {}
        const rawHandle = rawInfo.handle || rawInfo.nickname || rawInfo.username || null

        // Always try to fetch the full profile for accurate handle/name
        const fetched     = await fetchRSIProfile(token, rawHandle)
        const handle      = fetched?.handle      || rawHandle || null
        const displayName = fetched?.displayName || rawInfo.display_name || handle || (email || '').split('@')[0]
        const avatar      = fetched?.avatar      || rawInfo.image || rawInfo.avatar || null

        console.log('[RSI] Profile resolved - handle:', handle, 'displayName:', displayName)
        return {
          success: true,
          profile: { name: displayName, handle, avatar, rsiHandle: handle },
          games: RSI_GAMES_CATALOG,
        }
      }

      // Known error codes
      const errCode = d.code || d.data?.code
      if (errCode === 1036 || errCode === 1037) return { success: false, error: 'Code expired or already used. Request a new one.' }
      if (errCode === 1038) return { success: false, error: 'Too many attempts. Wait a few minutes and try again.' }

      // Return the error from this endpoint
      const msg = d.msg || d.message || d.error || `HTTP ${res.status}`
      return { success: false, error: `RSI: ${msg}` }
    } catch(e) {
      continue
    }
  }

  // All endpoints failed
  return {
    success: false,
    error: 'Could not reach RSI authentication servers. RSI may have updated their API - check robertsspaceindustries.com to verify your account is not locked.',
  }
})

// We return a game-picker response so the UI can let the user choose which games they own.
const ROCKSTAR_PC_CATALOG = [
  { title: 'Grand Theft Auto V', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_600x900.jpg', backgroundUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/271590/library_hero.jpg', status: 'playing', genre: ['Action', 'Open World', 'Crime'], developer: 'Rockstar North', publisher: 'Rockstar Games', releaseYear: 2015, description: 'Grand Theft Auto V is an open world action-adventure game set in the fictional state of San Andreas.', playtime: 0, tags: ['open-world', 'crime', 'multiplayer'], notes: '' },
  { title: 'Red Dead Redemption 2', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_600x900.jpg', backgroundUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/library_hero.jpg', status: 'backlog', genre: ['Action', 'Western', 'Open World'], developer: 'Rockstar Games', publisher: 'Rockstar Games', releaseYear: 2019, description: 'An epic tale of life in America at the dawn of the modern age.', playtime: 0, tags: ['western', 'open-world', 'story'], notes: '' },
  { title: 'Grand Theft Auto IV', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12210/library_600x900.jpg', backgroundUrl: '', status: 'backlog', genre: ['Action', 'Open World', 'Crime'], developer: 'Rockstar North', publisher: 'Rockstar Games', releaseYear: 2008, description: 'Liberty City. The sprawling crime epic.', playtime: 0, tags: ['open-world', 'crime'], notes: '' },
  { title: 'Max Payne 3', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/204100/library_600x900.jpg', backgroundUrl: '', status: 'backlog', genre: ['Action', 'Shooter', 'Neo-Noir'], developer: 'Rockstar Studios', publisher: 'Rockstar Games', releaseYear: 2012, description: 'A gritty, bullet-time shooter set in São Paulo.', playtime: 0, tags: ['shooter', 'noir', 'bullet-time'], notes: '' },
  { title: 'L.A. Noire', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/110800/library_600x900.jpg', backgroundUrl: '', status: 'backlog', genre: ['Detective', 'Open World', 'Noir'], developer: 'Team Bondi', publisher: 'Rockstar Games', releaseYear: 2011, description: 'A detective thriller set in 1940s Los Angeles.', playtime: 0, tags: ['detective', 'noir', 'investigation'], notes: '' },
  { title: 'Bully: Scholarship Edition', platform: 'rockstar', coverUrl: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12200/library_600x900.jpg', backgroundUrl: '', status: 'backlog', genre: ['Action', 'Open World'], developer: 'Rockstar Vancouver', publisher: 'Rockstar Games', releaseYear: 2008, description: 'Navigate the social hierarchy of Bullworth Academy.', playtime: 0, tags: ['open-world', 'school', 'comedy'], notes: '' },
]

ipcMain.handle('platform-connect-rockstar', async (_, { email, password }) => {
  if (!email || !password) return { success: false, error: 'Rockstar Social Club email and password required' }
  // Rockstar has no public API and blocks third-party auth.
  // Return a catalog-picker flow so the user can select their owned games.
  return {
    success: false,
    needsGamePicker: true,
    profile: { name: email.split('@')[0] },
    catalog: ROCKSTAR_PC_CATALOG,
    message: "Rockstar doesn't allow third-party API access. Select the games you own below to add them to your library."
  }
})

ipcMain.handle('platform-connect-ubisoft', async () => {
  return { success: false, needsManual: true, error: "Ubisoft Connect doesn't have a public API. Add Ubisoft games manually using the '+' button and set their executable paths." }
})

ipcMain.handle('platform-connect-ps', async () => {
  return { success: false, needsManual: true, error: "PlayStation doesn't have a PC game library API. Add PlayStation titles manually to track playtime through Launchpad." }
})

ipcMain.handle('platform-connect-emulator', async (_, { folderPath }) => {
  if (!folderPath) return { success: false, error: 'Select a folder containing ROM files' }
  if (!fs.existsSync(folderPath)) return { success: false, error: 'Folder not found: ' + folderPath }

  const ROM_EXTS = ['.n64', '.z64', '.v64', '.smc', '.sfc', '.nes', '.gba', '.gbc', '.gb', '.nds', '.iso', '.bin', '.cue', '.img', '.rom', '.md', '.gen', '.pce', '.gg', '.sms']
  const SYSTEM_MAP = { '.n64':'N64', '.z64':'N64', '.v64':'N64', '.smc':'SNES', '.sfc':'SNES', '.nes':'NES', '.gba':'GBA', '.gbc':'GBC', '.gb':'GameBoy', '.nds':'NDS', '.iso':'PS1/PS2', '.bin':'PS1/PS2', '.cue':'PS1/PS2', '.md':'Mega Drive', '.gen':'Mega Drive', '.pce':'PC Engine', '.gg':'Game Gear', '.sms':'Master System' }

  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
    const roms = files.filter(f => f.isFile() && ROM_EXTS.includes(path.extname(f.name).toLowerCase()))

    const games = roms.slice(0, 100).map(f => {
      const ext = path.extname(f.name).toLowerCase()
      const title = f.name.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').replace(/\(.*?\)/g, '').trim()
      const system = SYSTEM_MAP[ext] || 'Emulator'
      return {
        title,
        platform: 'emulator',
        coverUrl: '',
        backgroundUrl: '',
        executablePath: path.join(folderPath, f.name),
        status: 'backlog',
        genre: ['Classic', system],
        developer: '', publisher: '', description: `${system} ROM`, tags: [system.toLowerCase()], notes: '',
      }
    })
    return { success: true, profile: { name: `${path.basename(folderPath)} (${roms.length} ROMs)` }, gameCount: roms.length, games }
  } catch(e) { return { success: false, error: e.message } }
})

async function searchSteam(query) {
  try {
    const res = await httpGet(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`)
    if (!res.data?.items) return []
    return res.data.items.slice(0, 8).map(item => ({
      id: 'steam_' + item.id, steamAppId: item.id, name: item.name,
      background_image: item.tiny_image?.replace('capsule_sm_120', 'library_600x900') || item.tiny_image || '',
      released: null, genres: [], rating: null, source: 'steam',
    }))
  } catch(e) { return [] }
}

async function getSteamDetails(appId) {
  try {
    const res = await httpGet(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=US&l=english`)
    const game = res.data?.[String(appId)]?.data
    if (!game) return null
    const year = game.release_date?.date ? new Date(game.release_date.date).getFullYear() : null
    return {
      title: game.name, platform: 'steam',
      coverUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900.jpg`,
      backgroundUrl: game.screenshots?.[0]?.path_full || game.background || game.header_image || '',
      description: game.short_description || '',
      genre: (game.genres || []).map(g => g.description),
      developer: (game.developers || []).join(', '),
      publisher: (game.publishers || []).join(', '),
      releaseYear: isNaN(year) ? null : year,
      rating: game.metacritic?.score ? Math.round(game.metacritic.score / 10) : 0,
      tags: (game.categories || []).map(c => c.description).slice(0, 8),
      steamAppId: appId,
    }
  } catch(e) { return null }
}

async function searchRawg(query, apiKey) {
  if (!apiKey) return { results: [], error: 'No RAWG key' }
  try {
    const res = await httpGet(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=8&search_precise=true`)
    if (res.status === 401 || res.status === 403) return { results: [], error: 'Invalid RAWG key' }
    return { results: (res.data?.results || []).map(r => ({ ...r, source: 'rawg' })) }
  } catch(e) { return { results: [], error: e.message } }
}

async function getIGDBToken(clientId, clientSecret) {
  try {
    const res = await httpPost(`https://id.twitch.tv/oauth2/token`, `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`)
    return res.data?.access_token || null
  } catch(e) { return null }
}

async function searchIGDB(query, clientId, clientSecret) {
  if (!clientId || !clientSecret) return { results: [], error: 'No IGDB credentials' }
  try {
    const token = await getIGDBToken(clientId, clientSecret)
    if (!token) return { results: [], error: 'IGDB auth failed' }
    const result = await new Promise((resolve, reject) => {
      const opts = { hostname: 'api.igdb.com', path: '/v4/games', method: 'POST', headers: { 'Client-ID': clientId, 'Authorization': `Bearer ${token}`, 'Content-Type': 'text/plain', 'User-Agent': 'Launchpad/2.0' } }
      const req = https.request(opts, res => {
        let d = ''; res.on('data', x => d += x); res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }) } catch { resolve({ status: res.statusCode, data: [] }) } })
      })
      req.on('error', reject)
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')) })
      req.write(`search "${query.replace(/"/g, '')}"; fields name,cover.url,first_release_date,genres.name,involved_companies.company.name,involved_companies.developer,involved_companies.publisher,summary,rating,slug; limit 8;`)
      req.end()
    })
    if (!Array.isArray(result.data)) return { results: [], error: 'IGDB error' }
    return {
      results: result.data.map(g => {
        const coverUrl = g.cover?.url ? 'https:' + g.cover.url.replace('t_thumb', 't_cover_big') : ''
        const year = g.first_release_date ? new Date(g.first_release_date * 1000).getFullYear() : null
        const devs = (g.involved_companies || []).filter(c => c.developer).map(c => c.company?.name).filter(Boolean)
        const pubs = (g.involved_companies || []).filter(c => c.publisher).map(c => c.company?.name).filter(Boolean)
        return { id: 'igdb_' + g.id, igdbId: g.id, name: g.name, background_image: coverUrl, released: year ? String(year) : null, genres: (g.genres || []).map(gr => ({ name: gr.name })), rating: g.rating ? +(g.rating / 10).toFixed(1) : null, description: g.summary || '', developer: devs.join(', '), publisher: pubs.join(', '), source: 'igdb', _fullData: g }
      })
    }
  } catch(e) { return { results: [], error: e.message } }
}

async function getRawgDetails(rawgId, apiKey) {
  if (!apiKey) return null
  try {
    const res = await httpGet(`https://api.rawg.io/api/games/${rawgId}?key=${apiKey}`)
    return res.data
  } catch { return null }
}

ipcMain.handle('search-games-unified', async (_, { query }) => {
  let rawgKey = '', igdbClientId = '', igdbClientSecret = ''
  try {
    const { safeStorage } = require('electron')
    const sec = loadSecure()
    if (safeStorage.isEncryptionAvailable()) {
      if (sec['rawgApiKey'])       rawgKey          = safeStorage.decryptString(Buffer.from(sec['rawgApiKey'],       'base64'))
      if (sec['igdbClientId'])     igdbClientId     = safeStorage.decryptString(Buffer.from(sec['igdbClientId'],     'base64'))
      if (sec['igdbClientSecret']) igdbClientSecret = safeStorage.decryptString(Buffer.from(sec['igdbClientSecret'], 'base64'))
    }
  } catch(e) {}
  // Fall through with whatever keys are available (renderer-provided as fallback for dev mode)
  const [steamRes, rawgRes, igdbRes] = await Promise.allSettled([
    searchSteam(query),
    rawgKey ? searchRawg(query, rawgKey) : Promise.resolve({ results: [] }),
    (igdbClientId && igdbClientSecret) ? searchIGDB(query, igdbClientId, igdbClientSecret) : Promise.resolve({ results: [] }),
  ])
  const results = [], errors = []
  if (steamRes.status === 'fulfilled') results.push(...(steamRes.value || []))
  if (rawgRes.status === 'fulfilled' && rawgRes.value.results) results.push(...rawgRes.value.results)
  if (rawgRes.status === 'fulfilled' && rawgRes.value.error) errors.push('RAWG: ' + rawgRes.value.error)
  if (igdbRes.status === 'fulfilled' && igdbRes.value.results) results.push(...igdbRes.value.results)
  if (igdbRes.status === 'fulfilled' && igdbRes.value.error) errors.push('IGDB: ' + igdbRes.value.error)
  const seen = new Set(), deduped = []
  for (const r of [...results.filter(r=>r.source==='igdb'), ...results.filter(r=>r.source==='rawg'), ...results.filter(r=>r.source==='steam')]) {
    const k = r.name?.toLowerCase().trim()
    if (k && !seen.has(k)) { seen.add(k); deduped.push(r) }
  }
  return { results: deduped.slice(0, 12), errors }
})

ipcMain.handle('get-game-details-unified', async (_, { result }) => {
  let rawgKey = '', igdbClientId = '', igdbClientSecret = ''
  try {
    const { safeStorage } = require('electron')
    const sec = loadSecure()
    if (safeStorage.isEncryptionAvailable()) {
      if (sec['rawgApiKey'])       rawgKey          = safeStorage.decryptString(Buffer.from(sec['rawgApiKey'],       'base64'))
      if (sec['igdbClientId'])     igdbClientId     = safeStorage.decryptString(Buffer.from(sec['igdbClientId'],     'base64'))
      if (sec['igdbClientSecret']) igdbClientSecret = safeStorage.decryptString(Buffer.from(sec['igdbClientSecret'], 'base64'))
    }
  } catch(e) {}
  try {
    if (result.source === 'steam' && result.steamAppId) {
      const d = await getSteamDetails(result.steamAppId)
      return { success: !!d, game: d }
    }
    if (result.source === 'rawg' && rawgKey) {
      const d = await getRawgDetails(result.id, rawgKey)
      return { success: !!d, game: d, source: 'rawg' }
    }
    if (result.source === 'igdb') return { success: true, game: result, source: 'igdb' }
    return { success: false, error: 'Unknown source' }
  } catch(e) { return { success: false, error: e.message } }
})

// Reads every .log file in a LogBackups folder, extracts session start/end times,
// deduplicates by session ID or file hash, and returns clean session records.
ipcMain.handle('parse-sc-logs', async (_, { folderPath }) => {
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, error: 'Folder not found: ' + folderPath }
  }

  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(f => f.isFile() && (f.name.endsWith('.log') || f.name.toLowerCase().includes('game_build')))
      .map(f => path.join(folderPath, f.name))

    if (files.length === 0) {
      return { success: false, error: 'No .log files found in this folder. Make sure you selected the LogBackups directory.' }
    }

    const sessions = []
    const seenSessions = new Set()

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines   = content.split('\n').slice(0, 5)  // only need first few lines for start

        // Extract start timestamp from first line: <2026-04-17T09:09:19.283Z> Log started on ...
        let startTs = null
        for (const line of lines) {
          const m = line.match(/<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)>/)
          if (m) { startTs = new Date(m[1]); break }
        }
        if (!startTs || isNaN(startTs.getTime())) continue

        // Extract end timestamp: look for SystemQuit or Fast Shutdown (near end of file)
        // Read last 50 lines for efficiency
        const allLines = content.split('\n')
        const lastLines = allLines.slice(-80)
        let endTs = null
        for (let i = lastLines.length - 1; i >= 0; i--) {
          const line = lastLines[i]
          if (line.includes('SystemQuit') || line.includes('Fast Shutdown') || line.includes('System Shutdown')) {
            const m = line.match(/<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)>/)
            if (m) { endTs = new Date(m[1]); break }
          }
        }

        // If no clean shutdown found, estimate from last timestamp in file
        if (!endTs) {
          for (let i = allLines.length - 1; i >= 0; i--) {
            const m = allLines[i].match(/<(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)>/)
            if (m) { endTs = new Date(m[1]); break }
          }
        }

        if (!endTs || isNaN(endTs.getTime())) continue

        // Duration in minutes (ignore suspiciously short sessions < 1min)
        const durationMins = Math.round((endTs - startTs) / 60000)
        if (durationMins < 1) continue
        // Ignore unrealistically long sessions > 24h (likely clock issues)
        if (durationMins > 1440) continue

        // Deduplicate by start timestamp (each file = one session)
        const sessionKey = startTs.toISOString()
        if (seenSessions.has(sessionKey)) continue
        seenSessions.add(sessionKey)

        sessions.push({
          date:        startTs.toISOString().split('T')[0],
          startedAt:   startTs.toISOString(),
          endedAt:     endTs.toISOString(),
          duration:    durationMins,
          fileName:    path.basename(filePath),
        })
      } catch(e) {
        // Skip unreadable files silently
      }
    }

    // Sort chronologically
    sessions.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt))

    const totalMins = sessions.reduce((s, sess) => s + sess.duration, 0)
    return {
      success:      true,
      sessions,
      totalMins,
      sessionCount: sessions.length,
      filesScanned: files.length,
    }
  } catch(e) {
    return { success: false, error: e.message }
  }
})

ipcMain.handle('pick-exe', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Select Game Executable', filters: [{ name: 'Executables', extensions: ['exe','lnk','bat','sh'] },{ name: 'All Files', extensions: ['*'] }], properties: ['openFile'] })
  return r.canceled ? null : r.filePaths[0]
})
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Select Folder', properties: ['openDirectory'] })
  return r.canceled ? null : r.filePaths[0]
})

const runningGames = new Map()
ipcMain.handle('launch-game', async (event, { gameId, executablePath }) => {
  if (!executablePath) return { success: false, error: 'No executable path set' }
  // Normalize and validate path - block traversal and non-exe files
  const normalized = path.resolve(executablePath)
  const ext = path.extname(normalized).toLowerCase()
  const allowedExts = ['.exe', '.bat', '.cmd', '.lnk', '.url']
  if (!allowedExts.includes(ext)) return { success: false, error: 'Invalid executable type: ' + ext }
  if (!fs.existsSync(normalized)) return { success: false, error: `File not found:\n${normalized}` }
  if (runningGames.has(gameId)) return { success: false, error: 'Already running' }
  try {
    const gp = spawn(normalized, [], { detached: true, stdio: 'ignore', cwd: path.dirname(normalized) })
    const startTime = Date.now()
    runningGames.set(gameId, { process: gp, startTime })
    event.sender.send('game-started', { gameId, startTime })
    gp.on('close', () => {
      const entry = runningGames.get(gameId)
      if (!entry) return
      const mins = Math.max(0, Math.round((Date.now() - entry.startTime) / 60000))
      runningGames.delete(gameId)
      event.sender.send('game-exited', { gameId, durationMins: mins, startTime: entry.startTime })
    })
    gp.on('error', err => { runningGames.delete(gameId); event.sender.send('game-error', { gameId, error: err.message }) })
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})
ipcMain.handle('stop-game', async (_, gameId) => {
  const entry = runningGames.get(gameId)
  if (!entry) return { success: false, error: 'Not running' }
  try {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', entry.process.pid, '/f', '/t'])
    else entry.process.kill('SIGTERM')
    return { success: true }
  } catch(e) { return { success: false, error: e.message } }
})
ipcMain.handle('get-running-games', () => [...runningGames.keys()])

// Uses icon.ico from the build folder for the tray icon.
// Right-click shows a CUSTOM styled BrowserWindow popup (not the native OS menu)
// so it matches the launcher's dark cyberpunk aesthetic exactly.

let tray           = null
let trayPopup      = null          // the custom menu popup BrowserWindow
let currentAccentHex = '#3b82f6'  // synced from renderer settings
let closeToTray    = false         // true while a game is running

function getTrayIconPath() {
  // icon.ico lives alongside main.js in the electron/ folder -
  // this path works in both dev and the installed/packaged app.
  const icoPath = path.join(__dirname, 'icon.ico')
  if (fs.existsSync(icoPath)) return icoPath
  return null
}

function createTrayPopup() {
  // Destroy any existing popup first
  if (trayPopup && !trayPopup.isDestroyed()) {
    trayPopup.destroy()
    trayPopup = null
  }

  const menuHtml = path.join(__dirname, 'tray-menu.html')

  trayPopup = new BrowserWindow({
    width: 196,
    height: closeToTray ? 342 : 316,  // taller when game-running badge is shown
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'tray-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    }
  })

  const params = new URLSearchParams({
    accent:      currentAccentHex,
    gameRunning: closeToTray ? '1' : '0',
  })
  trayPopup.loadFile(menuHtml, { query: Object.fromEntries(params) })
  trayPopup.setVisibleOnAllWorkspaces(true)

  // Auto-close when it loses focus
  trayPopup.on('blur', () => {
    if (trayPopup && !trayPopup.isDestroyed()) {
      trayPopup.hide()
    }
  })

  trayPopup.on('closed', () => { trayPopup = null })

  return trayPopup
}

function showTrayPopup() {
  // Always recreate to get fresh accent color / game-running state
  const popup = createTrayPopup()

  // Position just above the tray icon
  const { screen } = require('electron')
  const trayBounds = tray.getBounds()
  const display    = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y })
  const workArea   = display.workArea
  const popupW     = 196
  const popupH     = closeToTray ? 342 : 316

  // On Windows taskbar is usually at the bottom → popup appears above icon
  // Detect taskbar position by comparing workArea to display bounds
  let x = Math.round(trayBounds.x + trayBounds.width / 2 - popupW / 2)
  let y = Math.round(trayBounds.y - popupH - 2)

  // Taskbar on top
  if (trayBounds.y < workArea.y + 10) {
    y = trayBounds.y + trayBounds.height + 2
  }

  // Clamp to screen edges
  x = Math.max(workArea.x + 4, Math.min(x, workArea.x + workArea.width - popupW - 4))
  y = Math.max(workArea.y + 4, Math.min(y, workArea.y + workArea.height - popupH - 4))

  popup.setBounds({ x, y, width: popupW, height: popupH })
  popup.show()
  popup.focus()
}

function createTray() {
  if (tray) return

  const iconPath = getTrayIconPath()
  tray = iconPath ? new Tray(iconPath) : new Tray(nativeImage.createEmpty())
  tray.setToolTip('Launchpad')

  // Left-click → show/restore the main window
  tray.on('click', () => {
    if (trayPopup && !trayPopup.isDestroyed() && trayPopup.isVisible()) {
      trayPopup.hide()
      return
    }
    if (!win) { createWindow(); return }
    if (win.isVisible()) {
      win.focus()
    } else {
      win.show()
      win.focus()
    }
  })

  // Right-click → show custom styled popup menu
  tray.on('right-click', () => {
    showTrayPopup()
  })

  // On Windows, double-click also shows the window
  tray.on('double-click', () => {
    if (!win) { createWindow(); return }
    win.show()
    win.focus()
  })
}

ipcMain.on('tray-popup-navigate', (_, page) => {
  if (trayPopup && !trayPopup.isDestroyed()) trayPopup.hide()
  if (!win) createWindow()
  win.show()
  win.focus()
  win.webContents.send('tray-navigate', page)
})

ipcMain.on('tray-popup-show', () => {
  if (trayPopup && !trayPopup.isDestroyed()) trayPopup.hide()
  if (!win) createWindow()
  win.show()
  win.focus()
})

ipcMain.on('tray-popup-exit', () => {
  if (trayPopup && !trayPopup.isDestroyed()) trayPopup.destroy()
  closeToTray = false
  app.quit()
})

ipcMain.on('tray-popup-close', () => {
  if (trayPopup && !trayPopup.isDestroyed()) trayPopup.hide()
})

// Called by renderer when accent color changes
ipcMain.on('tray-update-theme', (_, accentHex) => {
  currentAccentHex = accentHex || '#3b82f6'
  // Popup is recreated on next open, so no action needed here
})

// Called by renderer when a game starts/stops
ipcMain.on('tray-set-game-running', (_, isRunning) => {
  closeToTray = isRunning
  if (tray) tray.setToolTip(isRunning ? 'Launchpad - Game Running' : 'Launchpad')
})

let win
function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1100, minHeight: 700,
    frame: false, backgroundColor: '#080c12',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  })
  if (isDev) { win.loadURL('http://localhost:5173'); win.webContents.openDevTools({ mode: 'detach' }) }
  else win.loadURL('file:///' + path.join(__dirname, '../dist/index.html').replace(/\\/g, '/'))

  // Intercept the close button: minimize to tray if a game is running,
  // otherwise close normally (but tray stays alive for quick reopen)
  win.on('close', (e) => {
    if (closeToTray) {
      e.preventDefault()
      win.hide()
      // Show a one-time balloon notification on Windows
      if (process.platform === 'win32' && tray) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Launchpad',
          content: 'Your game is still running. Launchpad is minimized to the tray.',
        })
      }
      return
    }
    // No game running - hide to tray instead of fully quitting
    // so the tray icon stays usable; actual quit is via tray → Exit
    e.preventDefault()
    win.hide()
  })

  win.on('closed', () => { win = null })
}
ipcMain.on('win-minimize', () => win?.minimize())
ipcMain.on('win-maximize', () => { if (!win) return; win.isMaximized() ? win.unmaximize() : win.maximize() })
ipcMain.on('win-close',    () => win?.close())

app.whenReady().then(async () => {
  createWindow()
  createTray()
  // Auto-enable Discord RPC if it was enabled in the previous session
  try {
    const settings = store['launchpad_settings']
    if (settings) {
      const s = JSON.parse(settings)
      // Restore accent color for tray icon
      if (s.accentColor) currentAccentHex = s.accentColor
      if (s.discordRPC !== false && s.discordClientId) {
        discordEnabled = true
        setTimeout(connectDiscordRPC, 3000)
      }
    }
  } catch(e) {}
})
// Don't quit when all windows closed - tray keeps the app alive
app.on('window-all-closed', () => {
  // On macOS, keep running. On Windows/Linux, keep tray alive too.
  // App only truly quits via tray → Exit or app.quit()
})
app.on('activate', () => {
  // macOS dock click - show window
  if (win) { win.show(); win.focus() }
  else createWindow()
})
app.on('before-quit', () => {
  // Allow real quit (from tray Exit)
  if (win) win.removeAllListeners('close')
})
