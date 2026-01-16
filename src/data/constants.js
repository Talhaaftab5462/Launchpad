export const ACCENT = '#00d4ff'
export const ACCENT2 = '#0a84ff'
export const SURFACE = '#080c12'
export const SURFACE2 = '#0d1520'
export const SURFACE3 = '#111b28'
export const BORDER = '#1a2d45'
export const BORDER_BRIGHT = '#00d4ff33'
export const TEXT = '#c8dce8'
export const TEXT_DIM = '#4a6a85'
export const TEXT_BRIGHT = '#e8f4ff'

export const PLATFORM_META = {
  steam:    { label: 'Steam',           color: '#0d1b2e', accent: '#66c0f4', border: '#1a3a5c', icon: 'steam'    },
  epic:     { label: 'Epic Games',      color: '#0d1118', accent: '#0078f2', border: '#0f2a50', icon: 'epic'     },
  gog:      { label: 'GOG Galaxy',      color: '#130d20', accent: '#a855f7', border: '#2a1550', icon: 'gog'      },
  xbox:     { label: 'Xbox',            color: '#0a1a0a', accent: '#52b043', border: '#0f3010', icon: 'xbox'     },
  ps:       { label: 'PlayStation',     color: '#050b1f', accent: '#0070d1', border: '#0a1a40', icon: 'ps'       },
  itchio:   { label: 'itch.io',         color: '#200808', accent: '#fa5c5c', border: '#400a0a', icon: 'itchio'   },
  emulator: { label: 'Emulator',        color: '#0d1520', accent: '#f59e0b', border: '#2a1e08', icon: 'emulator' },
  rsi:      { label: 'RSI Launcher',    color: '#050d18', accent: '#00d4ff', border: '#003850', icon: 'rsi'      },
  battle:   { label: 'Battle.net',      color: '#030d1a', accent: '#00b4ff', border: '#003060', icon: 'battle'   },
  ubisoft:  { label: 'Ubisoft Connect', color: '#07070f', accent: '#6366f1', border: '#14143a', icon: 'ubisoft'  },
  rockstar: { label: 'Rockstar',        color: '#0a0800', accent: '#f7c231', border: '#2a2000', icon: 'rockstar' },
  other:    { label: 'Other',           color: '#0d1520', accent: '#4a6a85', border: '#1a2d45', icon: 'other'    },
}

export const STATUS_META = {
  playing:   { label: 'Playing',   color: '#00d4ff', glow: '#00d4ff40' },
  completed: { label: 'Completed', color: '#00e5a0', glow: '#00e5a040' },
  backlog:   { label: 'Backlog',   color: '#f59e0b', glow: '#f59e0b40' },
  dropped:   { label: 'Dropped',   color: '#ef4444', glow: '#ef444440' },
  wishlist:  { label: 'Wishlist',  color: '#a855f7', glow: '#a855f740' },
}
