import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { coverImage, formatDate, getEntry, updateEntry } from '../lib/storage'
import { BackIcon } from '../components/icons'

export default function Entry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const initial = useMemo(() => getEntry(id), [id])

  const [entry, setEntry] = useState(initial)
  const [editing, setEditing] = useState(false)
  // working copy while editing
  const [images, setImages] = useState(initial?.images || [])
  const [cover, setCover] = useState(initial?.cover ?? 0)
  const fileRef = useRef(null)

  if (!entry) {
    return (
      <div className="app">
        <div className="corner-sparkle">*</div>
        <div className="top-row">
          <button className="icon-button back" onClick={() => navigate('/archive')}>
            <BackIcon />
            <span>archive</span>
          </button>
        </div>
        <div className="archive-empty">
          <p>this entry could not be found.</p>
        </div>
      </div>
    )
  }

  const startEdit = () => {
    setImages(entry.images || [])
    setCover(entry.cover ?? 0)
    setEditing(true)
  }

  const addFiles = (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setImages((prev) => [...prev, reader.result])
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i))
    setCover((c) => (i === c ? 0 : i < c ? c - 1 : c))
  }

  const onEditPaste = (e) => {
    const items = [...e.clipboardData.items].filter((it) => it.type.startsWith('image/'))
    if (items.length) {
      e.preventDefault()
      items.forEach((it) => {
        const file = it.getAsFile()
        if (file) addFiles([file])
      })
    }
  }

  const saveEdits = () => {
    const safeCover = Math.min(cover, Math.max(0, images.length - 1))
    const updated = updateEntry(entry.id, { images, cover: safeCover })
    setEntry(updated)
    setEditing(false)
  }

  const hero = coverImage(entry)

  return (
    <div className="app" onPaste={editing ? onEditPaste : undefined}>
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
        {editing ? (
          <div className="edit-actions">
            <button className="text-button ghost" onClick={() => setEditing(false)}>
              cancel
            </button>
            <button className="text-button" onClick={saveEdits}>
              save
            </button>
          </div>
        ) : (
          <button className="text-button" onClick={startEdit}>
            edit photos
          </button>
        )}
      </div>

      <article className="entry-page">
        {editing ? (
          <div className="photo-editor">
            <p className="photo-editor-label">
              photos — click a photo to make it the cover
            </p>
            <div className="photo-grid">
              {images.map((src, i) => (
                <div
                  key={i}
                  className={`photo-thumb${i === cover ? ' is-cover' : ''}`}
                  onClick={() => setCover(i)}
                >
                  <img src={src} alt="" />
                  {i === cover && <span className="cover-badge">cover</span>}
                  <button
                    className="photo-remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(i)
                    }}
                    aria-label="remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button className="photo-add" onClick={() => fileRef.current?.click()}>
                + add photo
              </button>
            </div>
            <p className="photo-editor-hint">tip: you can also paste an image here</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
        ) : (
          hero && (
            <div className="entry-hero">
              <img src={hero} alt="" />
            </div>
          )
        )}

        <p className="entry-prompt">{entry.prompt}</p>
        <p className="entry-date">{formatDate(entry.timestamp)}</p>
        <div className="entry-body">
          {entry.text.split('\n').map((line, i) => (
            <p key={i}>{line || ' '}</p>
          ))}
        </div>
      </article>
    </div>
  )
}
