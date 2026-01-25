import { useState, useCallback, useMemo } from 'react'

export function useSearch(games) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return games
      .filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.developer || '').toLowerCase().includes(q) ||
        (g.genre || []).some(genre => genre.toLowerCase().includes(q)) ||
        (g.tags || []).some(tag => tag.toLowerCase().includes(q)) ||
        (g.platform || '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [query, games])

  return { query, setQuery, results }
}
