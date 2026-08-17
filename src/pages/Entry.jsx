import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  addReply,
  deleteEntry,
  deleteReply,
  formatDate,
  getEntry,
  updateEntry,
} from '../lib/storage'
import { BackIcon, CornerSparkle, TrashIcon } from '../components/icons'
import { useConfirm } from '../components/Confirm'
import { useToast } from '../components/Toast'
import { BlockEditor, BlockView } from '../components/BlockEditor'
import MoodPicker, { MoodFace, moodMeta } from '../components/MoodPicker'
import TopNav from '../components/TopNav'

export default function Entry() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const toast = useToast()
  const initial = useMemo(() => getEntry(id), [id])

  const [entry, setEntry] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState(initial?.prompt || '')
  const [blocks, setBlocks] = useState(initial?.blocks || [])
  const [coverId, setCoverId] = useState(initial?.coverId || null)
  const [mood, setMood] = useState(initial?.mood || null)
  const [replyText, setReplyText] = useState('')
  const [searchParams] = useSearchParams()

  // open straight into edit mode when arrived via the archive "edit" action
  useEffect(() => {
    if (searchParams.get('edit') === '1' && initial) setEditing(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    try {
      setEntry(updateEntry(entry.id, { prompt, blocks, coverId, mood }))
    } catch {
      // storage full (usually a too-large image) — stop the hanging "saving…" and warn
      setEntry({ ...entry, prompt, blocks, coverId, mood })
      toast("couldn't save — storage is full. try a smaller image?")
    }
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

  const sendReply = () => {
    const text = replyText.trim()
    if (!text) return
    try {
      const updated = addReply(entry.id, text)
      if (updated) setEntry(updated)
      setReplyText('')
    } catch {
      toast("couldn't add that — storage is full. try a shorter note?")
    }
  }

  const removeReply = async (replyId) => {
    if (
      await confirm('delete this reply? this can’t be undone.', {
        confirmLabel: 'delete',
        cancelLabel: 'keep it',
      })
    ) {
      const updated = deleteReply(entry.id, replyId)
      if (updated) setEntry(updated)
    }
  }

  const onReplyKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

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
        <TopNav />
      </div>

      <article className="entry-page">
        {editing ? (
          <>
            <div className="entry-actions">
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
            </div>
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
            {/* title + actions on one line, top-aligned */}
            <div className="entry-head">
              <div className="entry-heading">
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
              </div>
              <div className="entry-actions">
                <button
                  className="text-button danger"
                  onClick={remove}
                  aria-label="delete entry"
                >
                  <TrashIcon />
                </button>
                <button className="text-button" onClick={startEdit}>
                  edit
                </button>
              </div>
            </div>

            <BlockView blocks={entry.blocks} />

            {/* replies — notes you add to this later. no reply but your own. */}
            <section className="entry-replies">
              {entry.replies?.length > 0 && (
                <div className="reply-list">
                  {entry.replies.map((r) => (
                    <div className="reply" key={r.id}>
                      <div className="reply-meta">
                        <span className="reply-date">replied {formatDate(r.timestamp)}</span>
                        <button
                          className="reply-del"
                          onClick={() => removeReply(r.id)}
                          aria-label="delete reply"
                        >
                          delete
                        </button>
                      </div>
                      <p className="reply-text">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="reply-composer">
                <textarea
                  className="reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={onReplyKeyDown}
                  placeholder="still on your mind? add to this later…"
                  rows={3}
                />
                <button
                  className="reply-send"
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                >
                  reply ↳
                </button>
              </div>
            </section>
          </>
        )}
      </article>
    </div>
  )
}
