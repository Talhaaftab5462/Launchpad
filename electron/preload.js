const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('storage', {
  get:    (k)    => ipcRenderer.invoke('storage-get', k),
  set:    (k, v) => ipcRenderer.invoke('storage-set', k, v),
  delete: (k)    => ipcRenderer.invoke('storage-delete', k),
  list:   (p)    => ipcRenderer.invoke('storage-list', p),
})

// after they've been saved. The renderer can SET once, then only reference by name.
contextBridge.exposeInMainWorld('secureStorage', {
  set:    (k, v) => ipcRenderer.invoke('secure-set',    k, v),
  get:    (k)    => ipcRenderer.invoke('secure-get',    k),
  delete: (k)    => ipcRenderer.invoke('secure-delete', k),
})

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:   () => ipcRenderer.send('win-minimize'),
  maximize:   () => ipcRenderer.send('win-maximize'),
  close:      () => ipcRenderer.send('win-close'),
  isElectron: true,

  // Tray
  setGameRunning:  (isRunning) => ipcRenderer.send('tray-set-game-running', isRunning),
  updateTrayTheme: (accentHex) => ipcRenderer.send('tray-update-theme', accentHex),
  onTrayNavigate:  (cb) => {
    ipcRenderer.on('tray-navigate', (_, page) => cb(page))
    return () => ipcRenderer.removeAllListeners('tray-navigate')
  },
})

contextBridge.exposeInMainWorld('discordAPI', {
  enable:       ()         => ipcRenderer.invoke('discord-enable'),
  disable:      ()         => ipcRenderer.invoke('discord-disable'),
  setActivity:  (activity) => ipcRenderer.invoke('discord-set-activity', activity),
  clearActivity:()         => ipcRenderer.invoke('discord-clear-activity'),
  getStatus:    ()         => ipcRenderer.invoke('discord-get-status'),
  reconnect:    ()         => ipcRenderer.invoke('discord-reconnect'),
  backupSave:   (url, data)=> ipcRenderer.invoke('discord-backup-save', { webhookUrl: url, data }),
  // Events
  onConnected:    (cb) => { ipcRenderer.on('discord-connected',    (_, d) => cb(d)); return () => ipcRenderer.removeAllListeners('discord-connected')    },
  onDisconnected:   (cb) => { ipcRenderer.on('discord-disconnected',    ()    => cb());   return () => ipcRenderer.removeAllListeners('discord-disconnected')    },
  onNoClientId:     (cb) => { ipcRenderer.on('discord-rpc-no-client-id', ()    => cb());   return () => ipcRenderer.removeAllListeners('discord-rpc-no-client-id') },
})

contextBridge.exposeInMainWorld('launchpad', {
  // File pickers
  pickExe:    () => ipcRenderer.invoke('pick-exe'),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),

  // Platform authentication
  connectSteam:    (creds) => ipcRenderer.invoke('platform-connect-steam',    creds),
  connectRSI:      (creds) => ipcRenderer.invoke('platform-connect-rsi',      creds),
  connectRSIMFA:   (data)  => ipcRenderer.invoke('platform-connect-rsi-mfa',  data),
  connectEpic:     (creds) => ipcRenderer.invoke('platform-connect-epic',     creds),
  connectGOG:      ()      => ipcRenderer.invoke('platform-connect-gog'),
  connectItchio:   (creds) => ipcRenderer.invoke('platform-connect-itchio',   creds),
  connectXbox:     ()      => ipcRenderer.invoke('platform-connect-xbox'),
  connectBattle:   (creds) => ipcRenderer.invoke('platform-connect-battle',   creds),
  connectRockstar: (creds) => ipcRenderer.invoke('platform-connect-rockstar', creds),
  connectUbisoft:  ()      => ipcRenderer.invoke('platform-connect-ubisoft'),
  connectPS:       ()      => ipcRenderer.invoke('platform-connect-ps'),
  connectEmulator: (data)  => ipcRenderer.invoke('platform-connect-emulator', data),

  // Steam friends
  getSteamFriends: (creds) => ipcRenderer.invoke('steam-get-friends', creds),

  // Game search
  searchGames:    (q, keys) => ipcRenderer.invoke('search-games-unified',    { query: q, ...keys }),
  getGameDetails: (r, keys) => ipcRenderer.invoke('get-game-details-unified', { result: r, ...keys }),

  // Star Citizen log parser
  parseScLogs:     (data)  => ipcRenderer.invoke('parse-sc-logs', data),

  // Game launching
  launchGame: (id, exe)  => ipcRenderer.invoke('launch-game',      { gameId: id, executablePath: exe }),
  stopGame:   (id)       => ipcRenderer.invoke('stop-game',        id),
  getRunning: ()         => ipcRenderer.invoke('get-running-games'),

  // Events
  onGameStarted: (cb) => { ipcRenderer.on('game-started', (_, d) => cb(d)); return () => ipcRenderer.removeAllListeners('game-started') },
  onGameExited:  (cb) => { ipcRenderer.on('game-exited',  (_, d) => cb(d)); return () => ipcRenderer.removeAllListeners('game-exited')  },
  onGameError:   (cb) => { ipcRenderer.on('game-error',   (_, d) => cb(d)); return () => ipcRenderer.removeAllListeners('game-error')   },
})
