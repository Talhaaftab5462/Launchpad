<div align="center">

<img src="build/icon.ico" width="80" alt="Launchpad Logo" />

# Launchpad

**A modern, feature-rich desktop game launcher built with Electron + React**

[![Electron](https://img.shields.io/badge/Electron-41.x-47848F?style=flat&logo=electron&logoColor=white)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D4?style=flat&logo=windows&logoColor=white)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

*A Playnite-inspired game library manager with a cyberpunk/military HUD aesthetic*

![Launchpad Screenshot](https://i.postimg.cc/02kC2BQZ/Launchpad.png)

</div>

---

## Overview

Launchpad is a desktop game launcher that unifies multiple gaming platforms into a single, polished interface. Built as an Electron + React SPA, it provides a premium native desktop experience with deep platform integrations, real-time playtime tracking, Discord Rich Presence, and a fully themed system tray.

The UI is inspired by Roberts Space Industries' (RSI) launcher, featuring a deep space color palette, angular clip-path components, scanline overlays, and accent-color theming throughout.

---

## Features

### 🎮 Game Library
- Unified library across all connected platforms
- Grid and list view with smooth transitions
- Filter by platform, genre, status, and tags
- Sort by name, playtime, date added, or rating
- Bulk actions: update status, add to collection, delete
- Right-click context menu on every game card

### 🔌 Platform Integrations
| Platform | Method | What's Imported |
|---|---|---|
| Steam | Web API key | Full library, playtime, achievements |
| RSI Launcher | OAuth + MFA | Star Citizen, Squadron 42 |
| Epic Games | Developer credentials | Owned library |
| GOG Galaxy | OAuth (browser) | DRM-free library |
| Battle.net | Blizzard OAuth | Blizzard titles |
| Xbox / Game Pass | Microsoft OAuth | Game Pass catalog |
| itch.io | API key | Purchased indie games |
| Rockstar Social Club | Credential login | Rockstar PC catalog |
| Ubisoft Connect | Manual | Track via Add Game |
| PlayStation | Manual | Track console titles |
| Emulators / RetroArch | Folder scan | N64, SNES, GBA, PS1 ROMs |

### 📊 Statistics & Tracking
- Live playtime tracker: detects game launch and exit automatically
- Per-session logging with date and duration
- Statistics page: total hours, most played, weekly/monthly charts
- Platform breakdown, genre heatmap, completion rate

### 👥 Social
- Real Steam friends feed (online status, current game, recent activity)
- Discord Rich Presence: shows current game, cover art, elapsed time
- Discord webhook cloud backup for library data

### 🗂️ Organisation
- Collections: user-created game groups (Backlog, Favourites, Co-op Night, etc.)
- Status tracking: Playing, Completed, Backlog, Dropped, Wishlist
- Tags and notes per game
- Achievements view per game

### 🖥️ Desktop Integration
- Frameless custom window with min/max/close controls
- System tray with custom-styled right-click popup menu
- Close-to-tray when a game is running (balloon notification on Windows)
- Left-click tray icon to show/hide launcher
- Tray menu accent color synced with current theme

### ⚙️ Settings & Customisation
- Accent color picker (6 presets + custom hex): affects entire UI including tray
- Layout density options
- Encrypted API key storage via Electron `safeStorage`
- Keyboard shortcuts: `Ctrl+K` command palette, `Escape` to close modals
- Command palette with fuzzy search over games and nav actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | [Electron 41](https://electronjs.org) |
| UI framework | [React 18](https://reactjs.org) with hooks |
| Build tool | [Vite 7](https://vitejs.dev) |
| Styling | Tailwind CSS utility classes + inline styles |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org) |
| Icons | [Lucide React](https://lucide.dev) |
| Discord | [discord-rpc](https://github.com/nicehash/discord-rpc) |
| Installer | [electron-builder](https://www.electron.build) NSIS |

---

## Project Structure

```
launchpad/
├── electron/
│   ├── main.js              # Main process, IPC, tray, game launcher
│   ├── preload.js           # Context bridge, exposes safe IPC to renderer
│   ├── tray-menu.html       # Custom styled tray popup (standalone HTML)
│   ├── tray-preload.js      # Preload for tray popup window
│   └── icon.ico             # App icon (tray, taskbar, installer)
├── src/
│   ├── assets/platforms/    # Platform logo PNGs
│   ├── components/
│   │   ├── layout/          # Sidebar, TopBar
│   │   ├── library/         # GameCard, AddGameModal, BulkActionsBar
│   │   └── ui/              # RSI design system, Toast, Modal, Badges, etc.
│   ├── data/
│   │   └── constants.js     # PLATFORM_META, STATUS_META, colour tokens
│   ├── hooks/               # useLibrary, useGameLauncher, useSteamFriends, etc.
│   ├── pages/               # One component per page/view
│   ├── App.jsx              # Root: routing state, global hooks, tray sync
│   └── main.jsx             # React entry point
├── build/
│   └── icon.ico             # electron-builder resource
├── index.html
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) v18 or higher
- [Git](https://git-scm.com)
- Windows 10/11 (for full feature set; macOS/Linux partial support)

### Development

```bash
# Clone the repository
git clone https://github.com/Talhaaftab5462/launchpad.git
cd launchpad

# Install dependencies
npm install

# Start dev server + Electron together
npm run electron-dev
```

### Build Installer (Windows)

```bash
# Builds Vite SPA then packages as NSIS installer
npm run dist:win
```

Output: `release/Launchpad Setup 1.0.0.exe`

The installer creates desktop and Start Menu shortcuts, allows custom install directory, and does not require admin privileges by default.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server only (browser preview) |
| `npm run electron-dev` | Full dev mode: Vite + Electron in parallel |
| `npm run build` | Build React SPA to `dist/` |
| `npm run dist:win` | Build + package Windows NSIS installer |
| `npm run dist:mac` | Build + package macOS DMG |
| `npm run dist:linux` | Build + package Linux AppImage |

---

## Platform Setup Guide

<details>
<summary><b>Steam</b></summary>

1. Go to [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Generate a Web API key
3. In Launchpad → Platforms → Steam → Connect, enter your API key and Steam ID
4. Click Sync to import your library

</details>

<details>
<summary><b>RSI / Star Citizen</b></summary>

1. In Launchpad → Platforms → RSI Launcher → Connect
2. Enter your RSI account email and password
3. Complete MFA if prompted (TOTP or email code)
4. Your Star Citizen and Squadron 42 licenses will be imported

</details>

<details>
<summary><b>Epic Games</b></summary>

1. Go to [dev.epicgames.com/portal](https://dev.epicgames.com/portal)
2. Create an application and obtain Client ID + Client Secret
3. Enter credentials in Launchpad → Platforms → Epic Games → Connect

</details>

---

## Contributing

Pull requests are welcome. For major changes please open an issue first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit with conventional commits (`feat:`, `fix:`, `chore:`)
4. Push and open a Pull Request

---

## Credits & Acknowledgements

- **[Playnite](https://playnite.link)**: open-source game library manager, primary inspiration
- **[Roberts Space Industries](https://robertsspaceindustries.com)**: UI/UX aesthetic inspiration
- **[Basic iOS 14 App Icon Pack](https://www.pinterest.com/pin/719801952937960261/)**: launcher application icon
- **[Lucide Icons](https://lucide.dev)**: UI icon set
- **[Rajdhani & Share Tech Mono](https://fonts.google.com)**: typography via Google Fonts

---

## License

MIT © 2026 Talha
