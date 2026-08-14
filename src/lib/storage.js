// Local-only persistence for journal entries.
// Modern entry: { id, prompt, blocks: Block[], coverId, timestamp }
//   Block = { id, type:'text', text } | { id, type:'image', src, width }
// Older entries ({ text, images[], cover }) are migrated to blocks on load.

const STORAGE_KEY = 'no-reply-entries'

export function newId() {
  return makeId()
}

// Ask the browser to keep this site's data and NOT evict it (e.g. Safari's
// ~7-day cleanup). Best-effort: resolves true if storage is now persistent.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

// migrate any older entry shape into { blocks, coverId }
function normalize(entry) {
  if (Array.isArray(entry.blocks)) return { mood: null, ...entry }
  const blocks = [{ id: makeId(), type: 'text', text: entry.text || '' }]
  const imgs = Array.isArray(entry.images) ? entry.images : entry.image ? [entry.image] : []
  let coverId = null
  imgs.forEach((src, i) => {
    const b = { id: makeId(), type: 'image', src, width: null }
    blocks.push(b)
    if (i === (entry.cover ?? 0)) coverId = b.id
  })
  return {
    id: entry.id,
    prompt: entry.prompt,
    timestamp: entry.timestamp,
    blocks,
    coverId,
    mood: entry.mood ?? null,
  }
}

// build blocks from plain text + an optional single image (used by quick note)
export function textToBlocks(text, image) {
  const blocks = [{ id: makeId(), type: 'text', text: text || '' }]
  let coverId = null
  if (image) {
    const b = { id: makeId(), type: 'image', src: image, width: null }
    blocks.push(b)
    coverId = b.id
  }
  return { blocks, coverId }
}

// the chosen cover image src (or the first image, or null)
export function coverImage(entry) {
  if (!entry) return null
  const blocks = entry.blocks || []
  const chosen = blocks.find((b) => b.type === 'image' && b.id === entry.coverId)
  if (chosen) return chosen.src
  const first = blocks.find((b) => b.type === 'image')
  return first ? first.src : null
}

// concatenated text of an entry (for titles / search)
export function entryText(entry) {
  return (entry?.blocks || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n\n')
    .trim()
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

export function addEntry({ prompt, blocks, coverId = null, mood = null }) {
  const entries = loadEntries()
  const entry = {
    id: makeId(),
    prompt,
    blocks,
    coverId,
    mood,
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

// --- in-progress composer draft (so unsaved new writing survives navigation) ---
const DRAFT_KEY = 'no-reply-draft'

export function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || null
  } catch {
    return null
  }
}

export function saveDraft(draft) {
  try {
    const blocksHaveContent = (draft?.blocks || []).some(
      (b) => (b.type === 'text' && b.text.trim()) || b.type === 'image',
    )
    if (draft && (draft.text?.trim() || draft.image || blocksHaveContent)) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } else {
      localStorage.removeItem(DRAFT_KEY)
    }
  } catch {
    /* ignore quota errors */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
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
