import { useState, useEffect, useCallback } from 'react'

// These keys are NEVER written to launchpad_settings in plaintext.
const SECURE_KEYS = new Set(['rawgApiKey', 'igdbClientId', 'igdbClientSecret', 'discordWebhook'])

const isElectron = typeof window !== 'undefined' && typeof window.secureStorage !== 'undefined'

const DEFAULTS = {
  accentColor:          (window.__INITIAL_ACCENT__ ?? '#3b82f6'),
  sidebarCollapsed:     false,
  defaultView:          'grid',
  density:              'comfortable',
  showPlaytime:         true,
  showAchBadges:        true,
  bgBlur:               3,
  discordRPC:           true,
  discordShowGame:      true,
  discordShowPlaytime:  true,
  discordClientId:      '',
}

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loaded,   setLoaded]   = useState(false)

  useEffect(() => {
    (async () => {
      try {
        // Load non-sensitive settings from regular storage
        const res = await window.storage.get('launchpad_settings')
        let saved = {}
        if (res?.value) saved = JSON.parse(res.value)

        // Load sensitive keys from secure storage if available
        if (isElectron) {
          for (const key of SECURE_KEYS) {
            try {
              const r = await window.secureStorage.get(key)
              if (r?.success && r.value) saved[key] = r.value
            } catch(e) {}
          }
        }

        setSettings({ ...DEFAULTS, ...saved })
      } catch(e) {}
      setLoaded(true)
    })()
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)

    if (SECURE_KEYS.has(key) && isElectron) {
      // Store sensitive keys in OS-encrypted storage
      try {
        if (value) {
          await window.secureStorage.set(key, value)
        } else {
          await window.secureStorage.delete(key)
        }
      } catch(e) {}
      // Also save a non-sensitive indicator (true/false) in regular settings so UI knows key is set
      const safeSettings = { ...next }
      for (const sk of SECURE_KEYS) {
        // Store boolean presence indicator, not the actual value
        safeSettings[sk] = safeSettings[sk] ? '__SECURED__' : ''
      }
      try { await window.storage.set('launchpad_settings', JSON.stringify(safeSettings)) } catch(e) {}
    } else {
      // Non-sensitive setting - store normally, but strip out any raw sensitive values
      const safeSettings = { ...next }
      for (const sk of SECURE_KEYS) {
        if (safeSettings[sk] && safeSettings[sk] !== '__SECURED__') {
          safeSettings[sk] = '__SECURED__'
        }
      }
      try { await window.storage.set('launchpad_settings', JSON.stringify(safeSettings)) } catch(e) {}
    }
  }, [settings])

  // Helper: check if a secure key has a value without exposing the value
  const hasSecureKey = useCallback((key) => {
    return !!settings[key] && settings[key] !== '__SECURED__' ? true : settings[key] === '__SECURED__'
  }, [settings])

  return { settings, updateSetting, loaded, hasSecureKey }
}