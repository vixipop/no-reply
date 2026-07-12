import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate, getEntry } from '../lib/storage'
import { BackIcon } from '../components/icons'

export default function Entry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const entry = useMemo(() => getEntry(id), [id])

  return (
    <div className="app">
      <div className="corner-sparkle">*</div>

      <div className="top-row">
        <button
          className="icon-button back"
          onClick={() => navigate('/archive')}
          aria-label="back to archive"
        >
          <BackIcon />
          <span>archive</span>
        </button>
      </div>

      {!entry ? (
        <div className="archive-empty">
          <p>this entry could not be found.</p>
        </div>
      ) : (
        <article className="entry-page">
          {entry.image && (
            <div className="entry-hero">
              <img src={entry.image} alt="" />
            </div>
          )}
          <p className="entry-prompt">{entry.prompt}</p>
          <p className="entry-date">{formatDate(entry.timestamp)}</p>
          <div className="entry-body">
            {entry.text.split('\n').map((line, i) => (
              <p key={i}>{line || ' '}</p>
            ))}
          </div>
        </article>
      )}
    </div>
  )
}
