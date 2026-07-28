import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  coverImage,
  deleteEntry,
  entryText,
  formatDate,
  loadEntries,
  withinRange,
} from '../lib/storage'
import { BackIcon, CornerSparkle, DotStar, SearchIcon, TrashIcon } from '../components/icons'

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
  const [entries, setEntries] = useState(loadEntries)
  const [range, setRange] = useState('all')
  const [query, setQuery] = useState('')

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
        <span className="page-count">{entries.length} entries</span>
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
