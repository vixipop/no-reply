import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteEntry, formatDate, getEntry, updateEntry } from '../lib/storage'
import { BackIcon, CornerSparkle, TrashIcon } from '../components/icons'
import { useConfirm } from '../components/Confirm'
import { BlockEditor, BlockView } from '../components/BlockEditor'
import MoodPicker, { MoodFace, moodMeta } from '../components/MoodPicker'

export default function Entry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const initial = useMemo(() => getEntry(id), [id])

  const [entry, setEntry] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState(initial?.prompt || '')
  const [blocks, setBlocks] = useState(initial?.blocks || [])
  const [coverId, setCoverId] = useState(initial?.coverId || null)
  const [mood, setMood] = useState(initial?.mood || null)

  // are there unsaved edits?
  const dirty =
    editing &&
    !!entry &&
    (prompt !== entry.prompt ||
      coverId !== entry.coverId ||
      mood !== (entry.mood || null) ||
      JSON.stringify(blocks) !== JSON.stringify(entry.blocks))

  // autosave (debounced) — no manual save, no unsaved-changes guard
  const flushSave = () => {
    if (!entry) return
    setEntry(updateEntry(entry.id, { prompt, blocks, coverId, mood }))
  }
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(flushSave, 900)
    return () => clearTimeout(t)
  }, [dirty, prompt, blocks, coverId, mood]) // eslint-disable-line react-hooks/exhaustive-deps

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
    setBlocks(entry.blocks || [])
    setCoverId(entry.coverId || null)
    setMood(entry.mood || null)
    setEditing(true)
  }

  const readMood = moodMeta(entry.mood)

  const remove = async () => {
    if (
      await confirm("delete this entry? this can't be undone.", {
        confirmLabel: 'delete',
        cancelLabel: 'keep it',
      })
    ) {
      deleteEntry(entry.id)
      navigate('/archive')
    }
  }

  return (
    <div className="app">
      <CornerSparkle />

      <div className="top-row">
        <button
          className="icon-button back"
          onClick={() => {
            flushSave()
            navigate('/archive')
          }}
          aria-label="back to archive"
        >
          <BackIcon />
          <span>archive</span>
        </button>
      </div>

      <article className="entry-page">
        <div className="entry-actions">
          {editing ? (
            <>
              <span className="saved-indicator">{dirty ? 'saving…' : 'saved'}</span>
              <button
                className="text-button"
                onClick={() => {
                  flushSave()
                  setEditing(false)
                }}
              >
                done
              </button>
            </>
          ) : (
            <>
              <button className="text-button danger" onClick={remove} aria-label="delete entry">
                <TrashIcon />
              </button>
              <button className="text-button" onClick={startEdit}>
                edit
              </button>
            </>
          )}
        </div>

        {editing ? (
          <>
            <div className="entry-title-row">
              <input
                className="entry-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="title"
              />
              <MoodPicker value={mood} onChange={setMood} align="right" />
            </div>
            <BlockEditor
              blocks={blocks}
              coverId={coverId}
              onChange={setBlocks}
              onSetCover={setCoverId}
            />
          </>
        ) : (
          <>
            <p className="entry-prompt">{entry.prompt}</p>
            <p className="entry-date">
              {formatDate(entry.timestamp)}
              {readMood && (
                <span className="entry-mood" style={{ '--c': readMood.color }}>
                  <MoodFace mood={readMood.id} color={readMood.color} filled />
                  {readMood.label}
                </span>
              )}
            </p>
            <BlockView blocks={entry.blocks} />
          </>
        )}
      </article>
    </div>
  )
}
