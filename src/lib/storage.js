// Local-only persistence for journal entries.
// Each entry: { id, prompt, text, images: string[], cover: number, timestamp }
// (older entries used a single `image` field — normalised on load)

const STORAGE_KEY = 'no-reply-entries'

function normalize(entry) {
  if (Array.isArray(entry.images)) return entry
  return {
    ...entry,
    images: entry.image ? [entry.image] : [],
    cover: 0,
  }
}

export function loadEntries() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    return list.map(normalize).sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function addEntry({ prompt, text, images = [] }) {
  const entries = loadEntries()
  const entry = {
    id: makeId(),
    prompt,
    text,
    images,
    cover: 0,
    timestamp: Date.now(),
  }
  saveEntries([entry, ...entries])
  return entry
}

export function updateEntry(id, patch) {
  const entries = loadEntries().map((e) => (e.id === id ? { ...e, ...patch } : e))
  saveEntries(entries)
  return entries.find((e) => e.id === id) || null
}

export function getEntry(id) {
  return loadEntries().find((e) => e.id === id) || null
}

export function deleteEntry(id) {
  saveEntries(loadEntries().filter((e) => e.id !== id))
}

// the chosen cover photo (or first available), or null
export function coverImage(entry) {
  if (!entry) return null
  const imgs = entry.images || []
  const idx = entry.cover ?? 0
  return imgs[idx] || imgs[0] || null
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

export function weekCount(entries) {
  const weekStart = startOfWeek(new Date())
  return entries.filter((e) => new Date(e.timestamp) >= weekStart).length
}

// Whether an entry exists for today (drives the flame colour).
export function loggedToday(entries) {
  const today = new Date().toDateString()
  return entries.some((e) => new Date(e.timestamp).toDateString() === today)
}

// Consecutive-day streak. It does NOT reset to 0 just because today
// isn't logged yet — if yesterday was logged the streak still stands
// (the flame simply goes grey until you journal today).
export function streak(entries) {
  const days = new Set(entries.map((e) => new Date(e.timestamp).toDateString()))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // if today isn't logged, start counting from yesterday
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1)
  let count = 0
  while (days.has(cursor.toDateString())) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

// Filter helpers for the archive
export function withinRange(entry, range) {
  if (range === 'all') return true
  const now = new Date()
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  if (range === 'week') start.setDate(now.getDate() - now.getDay())
  else if (range === 'month') start.setDate(1)
  else if (range === 'year') {
    start.setMonth(0, 1)
  }
  return new Date(entry.timestamp) >= start
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
