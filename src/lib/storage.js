// Local-only persistence for journal entries.
// Each entry: { id, prompt, text, image (data URL | null), timestamp }

const STORAGE_KEY = 'no-reply-entries'

export function loadEntries() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    // newest first
    return list.sort((a, b) => b.timestamp - a.timestamp)
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

export function addEntry({ prompt, text, image = null }) {
  const entries = loadEntries()
  const entry = {
    id: makeId(),
    prompt,
    text,
    image,
    timestamp: Date.now(),
  }
  saveEntries([entry, ...entries])
  return entry
}

export function getEntry(id) {
  return loadEntries().find((e) => e.id === id) || null
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

export function streak(entries) {
  const days = new Set(entries.map((e) => new Date(e.timestamp).toDateString()))
  let count = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.has(cursor.toDateString())) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
