import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'launchpad_profile'

export const DEFAULT_PROFILE = {
  displayName: '',
  avatarUrl:   '',
  bio:         '',
  accentColor: '',       // override global accent for profile card
  createdAt:   null,
}

export function useProfile() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [loaded,  setLoaded]  = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY)
        if (r?.value) {
          const saved = JSON.parse(r.value)
          setProfile({ ...DEFAULT_PROFILE, ...saved })
        }
      } catch(e) {}
      setLoaded(true)
    })()
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setProfile(prev => {
      const next = { ...prev, ...updates }
      window.storage.set(STORAGE_KEY, JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])

  return { profile, updateProfile, loaded }
}
