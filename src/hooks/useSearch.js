import { useState, useMemo, useRef } from 'react'
import { SkipList } from '../data/SkipList'

export function useSearch(games) {
  const [query, setQuery] = useState('')
  const prevGamesRef = useRef(null)
  const slRef = useRef(null)

  if (prevGamesRef.current !== games) {
    slRef.current = SkipList.fromGames(games)
    prevGamesRef.current = games
  }

  const { results, traversalLog } = useMemo(() => {
    if (!query.trim()) return { results: [], traversalLog: null }
    const out = slRef.current.searchWithLog(query.trim())
    return { results: out.results, traversalLog: out }
  }, [query, games])

  return { query, setQuery, results, traversalLog }
}
