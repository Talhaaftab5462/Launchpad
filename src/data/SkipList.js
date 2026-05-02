const MAX_LEVEL = 6
const P = 0.5

class SkipListNode {
  constructor(key, value, level) {
    this.key     = key
    this.value   = value
    this.forward = new Array(level + 1).fill(null)
  }
}

export class SkipList {
  constructor() {
    this.level  = 0
    this.head   = new SkipListNode(-Infinity, null, MAX_LEVEL)
    this.length = 0
  }

  _randomLevel() {
    let lvl = 0
    while (Math.random() < P && lvl < MAX_LEVEL) lvl++
    return lvl
  }

  insert(key, value) {
    const update = new Array(MAX_LEVEL + 1).fill(null)
    let curr = this.head
    for (let i = this.level; i >= 0; i--) {
      while (curr.forward[i] && curr.forward[i].key < key) curr = curr.forward[i]
      update[i] = curr
    }
    curr = curr.forward[0]
    if (curr && curr.key === key) { curr.value = value; return }
    const newLevel = this._randomLevel()
    if (newLevel > this.level) {
      for (let i = this.level + 1; i <= newLevel; i++) update[i] = this.head
      this.level = newLevel
    }
    const node = new SkipListNode(key, value, newLevel)
    for (let i = 0; i <= newLevel; i++) {
      node.forward[i]    = update[i].forward[i]
      update[i].forward[i] = node
    }
    this.length++
  }

  delete(key) {
    const update = new Array(MAX_LEVEL + 1).fill(null)
    let curr = this.head
    for (let i = this.level; i >= 0; i--) {
      while (curr.forward[i] && curr.forward[i].key < key) curr = curr.forward[i]
      update[i] = curr
    }
    curr = curr.forward[0]
    if (!curr || curr.key !== key) return false
    for (let i = 0; i <= this.level; i++) {
      if (update[i].forward[i] !== curr) break
      update[i].forward[i] = curr.forward[i]
    }
    while (this.level > 0 && !this.head.forward[this.level]) this.level--
    this.length--
    return true
  }

  // search with traversal log for visualisation
  searchWithLog(query) {
    const q      = query.toLowerCase()
    const log    = []
    const results = []
    let compared  = 0
    let curr      = this.head

    for (let i = this.level; i >= 0; i--) {
      let skipped = 0
      while (curr.forward[i]) {
        const title = curr.forward[i].key
        compared++
        if (title.toLowerCase().startsWith(q) || title.toLowerCase().includes(q)) {
          results.push(curr.forward[i].value)
          curr = curr.forward[i]
          skipped++
        } else if (title.toLowerCase() < q) {
          curr = curr.forward[i]
          skipped++
        } else {
          break
        }
      }
      if (skipped > 0 || i === this.level) {
        log.push({ level: i, skipped, compared })
      }
    }

    return {
      results:  [...new Map(results.map(r => [r.id, r])).values()].slice(0, 9),
      log,
      compared,
      linear:   this.length,
    }
  }

  // build from array of game objects
  static fromGames(games) {
    const sl = new SkipList()
    const sorted = [...games].sort((a, b) => a.title.localeCompare(b.title))
    sorted.forEach(g => sl.insert(g.title.toLowerCase(), g))
    return sl
  }
}
