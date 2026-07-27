import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { coverImage, deleteEntry, formatDate, getEntry, updateEntry } from '../lib/storage'
import { BackIcon, CornerSparkle, TrashIcon } from '../components/icons'
import { useConfirm } from '../components/Confirm'

export default function Entry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const initial = useMemo(() => getEntry(id), [id])

  const [entry, setEntry] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState(initial?.prompt || '')
  const [text, setText] = useState(initial?.text || '')
  const [images, setImages] = useState(initial?.images || [])
  const [cover, setCover] = useState(initial?.cover ?? 0)
  const fileRef = useRef(null)

  // are there unsaved edits?
  const dirty =
    editing &&
    !!entry &&
    (prompt !== entry.prompt ||
      text !== entry.text ||
      (cover ?? 0) !== (entry.cover ?? 0) ||
      JSON.stringify(images) !== JSON.stringify(entry.images || []))

  // warn on tab close / refresh while there are unsaved edits
  useEffect(() => {
    if (!dirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // confirm (in-app sticky note) before navigation that would drop unsaved edits
  const leave = async (fn) => {
    if (dirty && !(await confirm('you have unsaved changes. save before you leave?'))) return
    fn()
  }

  if (!entry) {
    return (
      <div className="app">
        <CornerSparkle />
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
    setPrompt(entry.prompt)
    setText(entry.text)
    setImages(entry.images || [])
    setCover(entry.cover ?? 0)
    setEditing(true)
  }

  const addFiles = (fileList) => {
    ;[...fileList]
      .filter((f) => f.type.startsWith('image/'))
      .forEach((file) => {
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
    if (items.length && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      items.forEach((it) => {
        const file = it.getAsFile()
        if (file) addFiles([file])
      })
    }
  }

  const saveEdits = () => {
    const safeCover = Math.min(cover, Math.max(0, images.length - 1))
    const updated = updateEntry(entry.id, { prompt, text, images, cover: safeCover })
    setEntry(updated)
    setEditing(false)
  }

  const remove = async () => {
    if (await confirm("delete this entry? this can't be undone.", { confirmLabel: 'delete', cancelLabel: 'keep it' })) {
      deleteEntry(entry.id)
      navigate('/archive')
    }
  }

  const hero = coverImage(entry)

  return (
    <div className="app" onPaste={editing ? onEditPaste : undefined}>
      <CornerSparkle />

      <div className="top-row">
        <button
          className="icon-button back"
          onClick={() => leave(() => navigate('/archive'))}
          aria-label="back to archive"
        >
          <BackIcon />
          <span>archive</span>
        </button>
        {editing ? (
          <div className="edit-actions">
            <button className="text-button ghost" onClick={() => leave(() => setEditing(false))}>
              cancel
            </button>
            <button className="text-button" onClick={saveEdits}>
              save
            </button>
          </div>
        ) : (
          <div className="edit-actions">
            <button className="text-button danger" onClick={remove} aria-label="delete entry">
              <TrashIcon />
            </button>
            <button className="text-button" onClick={startEdit}>
              edit
            </button>
          </div>
        )}
      </div>

      <article className="entry-page">
        {editing ? (
          <>
            <div className="photo-editor">
              <p className="photo-editor-label">photos — click a photo to make it the cover</p>
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

            <input
              className="entry-prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="title"
            />
            <textarea
              className="entry-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="write your entry…"
            />
          </>
        ) : (
          <>
            {hero && (
              <div className="entry-hero">
                <img src={hero} alt="" />
              </div>
            )}
            <p className="entry-prompt">{entry.prompt}</p>
            <p className="entry-date">{formatDate(entry.timestamp)}</p>
            <div className="entry-body">{entry.text}</div>
          </>
        )}
      </article>
    </div>
  )
}
