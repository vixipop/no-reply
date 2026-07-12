import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coverImage, formatDate, loadEntries } from '../lib/storage'
import { BackIcon, DotStar } from '../components/icons'

function truncate(text, max = 90) {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

function EntryCard({ entry }) {
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
      </div>
      <div className="card-body">
        <h2 className="card-title">{truncate(entry.text) || 'untitled entry'}</h2>
        <p className="card-subtitle">{entry.prompt}</p>
        <p className="card-footer">{formatDate(entry.timestamp)}</p>
      </div>
    </Link>
  )
}

export default function Archive() {
  const navigate = useNavigate()
  const entries = useMemo(() => loadEntries(), [])

  return (
    <div className="app">
      <div className="corner-sparkle">*</div>

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

        {entries.length === 0 ? (
          <div className="archive-empty">
            <DotStar size={40} color="#6B8C76" />
            <p>nothing here yet — your entries will collect on this shelf.</p>
          </div>
        ) : (
          <div className="card-grid">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
