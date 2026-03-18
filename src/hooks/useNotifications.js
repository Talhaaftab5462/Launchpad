import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'launchpad_notifications'
const MAX_NOTIFICATIONS = 50

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY)
        if (r?.value) setNotifications(JSON.parse(r.value))
      } catch (e) {}
      setLoaded(true)
    })()
  }, [])

  const save = useCallback((notifs) => {
    window.storage.set(STORAGE_KEY, JSON.stringify(notifs)).catch(() => {})
  }, [])

  const addNotification = useCallback((type, title, body = '', meta = {}) => {
    setNotifications(prev => {
      const next = [{
        id: Date.now() + Math.random(),
        type,        // 'session' | 'import' | 'achievement' | 'info' | 'error'
        title,
        body,
        meta,        // { gameId, durationMins, ... }
        read: false,
        createdAt: new Date().toISOString(),
      }, ...prev].slice(0, MAX_NOTIFICATIONS)
      save(next)
      return next
    })
  }, [save])

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      save(next)
      return next
    })
  }, [save])

  const markRead = useCallback((id) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      save(next)
      return next
    })
  }, [save])

  const clearAll = useCallback(() => {
    setNotifications([])
    save([])
  }, [save])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, addNotification, markAllRead, markRead, clearAll, loaded }
}
