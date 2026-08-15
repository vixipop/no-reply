import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  coverImage,
  deleteEntry,
  entryText,
  exportData,
  formatDate,
  importData,
  loadEntries,
  withinRange,
} from '../lib/storage'
import { BackIcon, CornerSparkle, DotStar, SearchIcon, TrashIcon } from '../components/icons'
import { useToast } from '../components/Toast'

const RANGES = [
  { id: 'all', label: 'all' },
  { id: 'week', label: 'this week' },
  { id: 'month', label: 'this month' },
  { id: 'year', label: 'this year' },
]

function truncate(text, max = 90) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean
}

function EntryCard({ entry, onDelete }) {
  const cover = coverImage(entry)
  return (
    <Link to={`/entry/${entry.id}`} className="card">
      <div className="card-media">
        {cover ? (
          <img src={cover} alt="" />
        ) : (
          <div className="card-media-placeholder">
            <DotStar size={48} color="#6B8C76" />
          </div>
        )}
        <button
          className="card-delete"
          aria-label="delete entry"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onDelete(entry.id)
          }}
        >
          <TrashIcon />
        </button>
      </div>
      <div className="card-body">
        <h2 className="card-title">{truncate(entryText(entry)) || 'untitled entry'}</h2>
        <p className="card-subtitle">{entry.prompt}</p>
        <p className="card-footer">{formatDate(entry.timestamp)}</p>
      </div>
    </Link>
  )
}

export default function Archive() {
  const navigate = useNavigate()
  const toast = useToast()
  const [entries, setEntries] = useState(loadEntries)
  const [range, setRange] = useState('all')
  const [query, setQuery] = useState('')
  const fileRef = useRef(null)

  // download every entry as a JSON backup file
  const onExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `no-reply-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast(
      entries.length
        ? 'backup downloaded — keep it somewhere safe'
        : 'nothing to back up yet',
    )
  }

  // read a backup file and merge its entries in
  const onImport = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be re-picked later
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const { added, total } = importData(JSON.parse(reader.result))
        setEntries(loadEntries())
        toast(
          added === 0
            ? 'already up to date — nothing new to import'
            : `imported ${added} ${added === 1 ? 'entry' : 'entries'} · ${total} total`,
        )
      } catch {
        toast("that file isn't a no reply backup")
      }
    }
    reader.readAsText(file)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries
      .filter((e) => withinRange(e, range))
      .filter(
        (e) =>
          !q ||
          entryText(e).toLowerCase().includes(q) ||
          e.prompt.toLowerCase().includes(q),
      )
  }, [entries, range, query])

  const onDelete = (id) => {
    if (window.confirm('Delete this entry? This cannot be undone.')) {
      deleteEntry(id)
      setEntries(loadEntries())
    }
  }

  return (
    <div className="app">
      <CornerSparkle />

      <div className="top-row">
        <button className="icon-button back" onClick={() => navigate('/')} aria-label="back">
          <BackIcon />
          <span>back</span>
        </button>
        <div className="archive-actions">
          <button className="text-button" onClick={onExport} title="download a backup file">
            export
          </button>
          <button
            className="text-button"
            onClick={() => fileRef.current?.click()}
            title="import a backup file"
          >
            import
          </button>
          <span className="page-count">{entries.length} entries</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={onImport}
          />
        </div>
      </div>

      <div className="archive-wrap">
        <h1 className="archive-title">
          the <span className="highlight-word">archive</span>
        </h1>

        <div className="archive-toolbar">
          <label className="search-field">
            <SearchIcon />
            <input
              type="text"
              placeholder="search your entries…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="range-tabs">
            {RANGES.map((r) => (
              <button
                key={r.id}
                className={`range-tab${range === r.id ? ' active' : ''}`}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="archive-empty">
            <DotStar size={40} color="#6B8C76" />
            <p>
              {entries.length === 0
                ? 'nothing here yet — your entries will collect on this shelf.'
                : 'no entries match that.'}
            </p>
          </div>
        ) : (
          <div className="card-grid">
            {filtered.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
