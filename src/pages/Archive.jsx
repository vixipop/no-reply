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
import {
  BackIcon,
  CornerSparkle,
  DotStar,
  EditIcon,
  ReplyIcon,
  SearchIcon,
  SparkleStar,
  TrashIcon,
} from '../components/icons'
import { MoodFace, moodMeta } from '../components/MoodPicker'
import TopNav from '../components/TopNav'
import { useToast } from '../components/Toast'
import { useConfirm } from '../components/Confirm'

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

// stop a card-action button from also triggering the card's link navigation
const stop = (fn) => (e) => {
  e.preventDefault()
  e.stopPropagation()
  fn()
}

function EntryRow({ entry, onReply, onEdit, onDelete }) {
  const cover = coverImage(entry)
  const mood = moodMeta(entry.mood)
  const text = entryText(entry)
  const title = entry.prompt?.trim() || truncate(text, 46) || 'untitled'
  const preview = entry.prompt?.trim() ? truncate(text, 100) : ''

  return (
    <Link to={`/entry/${entry.id}`} className="arch-card">
      <div className="arch-lead">
        {cover ? (
          <img src={cover} alt="" />
        ) : mood ? (
          <span className="arch-lead-mood" style={{ '--c': mood.color }}>
            <MoodFace mood={mood.id} color={mood.color} filled />
          </span>
        ) : (
          <span className="arch-lead-empty">
            <SparkleStar seed={entry.id} size={30} color="rgba(247,244,213,0.42)" />
          </span>
        )}
      </div>

      <div className="arch-mid">
        <div className="arch-title">{title}</div>
        {preview && <div className="arch-preview">{preview}</div>}
        <div className="arch-meta">
          {cover && mood && <MoodFace mood={mood.id} color={mood.color} filled />}
          {formatDate(entry.timestamp)}
        </div>
      </div>

      <div className="arch-actions">
        <button
          className="arch-act reply"
          title="reply to your past self"
          aria-label="reply"
          onClick={stop(() => onReply(entry))}
        >
          <ReplyIcon />
        </button>
        <button
          className="arch-act"
          title="edit"
          aria-label="edit"
          onClick={stop(() => onEdit(entry))}
        >
          <EditIcon />
        </button>
        <button
          className="arch-act"
          title="delete"
          aria-label="delete"
          onClick={stop(() => onDelete(entry.id))}
        >
          <TrashIcon />
        </button>
      </div>
    </Link>
  )
}

export default function Archive() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
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
          (e.prompt || '').toLowerCase().includes(q),
      )
  }, [entries, range, query])

  const onReply = () => toast('reply to your past self — coming soon')
  const onEdit = (entry) => navigate(`/entry/${entry.id}?edit=1`)
  const onDelete = async (id) => {
    if (
      await confirm("delete this entry? this can't be undone.", {
        confirmLabel: 'delete',
        cancelLabel: 'keep it',
      })
    ) {
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
        <TopNav />
        <span className="page-count">{entries.length} entries</span>
      </div>

      <div className="archive-wrap">
        <h1 className="archive-title">archive</h1>

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
          <div className="arch-list">
            {filtered.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
