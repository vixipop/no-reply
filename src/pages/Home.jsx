import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import star1 from '../assets/star1.png'
import star2 from '../assets/star2.png'
import {
  addEntry,
  clearDraft,
  loadDraft,
  loadEntries,
  loggedToday,
  newId,
  saveDraft,
  streak,
  textToBlocks,
  weekCount,
} from '../lib/storage'
import { CornerSparkle, FireIcon, MicIcon, SendStar, SparkleMini } from '../components/icons'
import { useToast } from '../components/Toast'
import { BlockEditor } from '../components/BlockEditor'
import MoodPicker from '../components/MoodPicker'
import TopNav from '../components/TopNav'
import { fileToDataURL } from '../lib/image'

const emptyBlocks = () => [{ id: newId(), type: 'text', text: '' }]

// confirmation lines shown in the sticky-note toast after a save
const SAVE_LINES = [
  'sealed & saved.',
  "it's out of your head now.",
  'said and gone. lighter?',
  'kept. just for you.',
  "that's between you and you.",
]

// The rotation. `glow` is the word rendered in green — swap these freely later.
const PROMPTS = [
  { text: 'what did i notice today?', glow: 'notice' },
  { text: 'what am i proud of today?', glow: 'proud' },
  { text: 'letter to my future self', glow: 'future' },
  { text: 'bring up in therapy next', glow: 'therapy' },
  { text: 'what felt heavy today?', glow: 'heavy' },
  { text: 'what made me laugh?', glow: 'laugh' },
  { text: 'a thing worth keeping', glow: 'keeping' },
]

const LINE_LOCK = 10 // at 10+ lines the reel locks and the ghost hides

function renderPrompt(text, glow) {
  if (!glow) return text
  const i = text.toLowerCase().indexOf(glow.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <span className="highlight-word">{text.slice(i, i + glow.length)}</span>
      {text.slice(i + glow.length)}
    </>
  )
}

export default function Home() {
  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState(loadEntries)
  const [value, setValue] = useState('')
  const [image, setImage] = useState(null)
  const [lineCount, setLineCount] = useState(0)
  const [mode, setMode] = useState('quick') // 'quick' | 'journal'

  // journal-mode rich content
  const [blocks, setBlocks] = useState(emptyBlocks)
  const [coverId, setCoverId] = useState(null)
  const [mood, setMood] = useState(null)

  // prompt reel
  const [index, setIndex] = useState(0)
  const [prev, setPrev] = useState(null)
  const [direction, setDirection] = useState('down')
  const [customTitle, setCustomTitle] = useState(null)
  const [editing, setEditing] = useState(false)

  const taRef = useRef(null)
  const editRef = useRef(null)

  const weekTotal = useMemo(() => weekCount(entries), [entries])
  const dayStreak = useMemo(() => streak(entries), [entries])
  const didToday = useMemo(() => loggedToday(entries), [entries])

  const current = PROMPTS[index]
  const promptText = customTitle ?? current.text
  const promptGlow = customTitle ? null : current.glow
  const ghostText = PROMPTS[(index + 1) % PROMPTS.length].text

  // reel is locked (scroll no longer changes the prompt) in journal mode,
  // while editing a custom title, once a custom title exists, or past LINE_LOCK lines
  const reelLocked =
    mode === 'journal' || editing || customTitle !== null || lineCount >= LINE_LOCK
  const showGhost =
    mode === 'quick' && !editing && customTitle === null && lineCount < LINE_LOCK

  // refs so the once-registered listeners read the latest values
  const lockedRef = useRef(reelLocked)
  const indexRef = useRef(index)
  const transitioningRef = useRef(false)
  useEffect(() => {
    lockedRef.current = reelLocked
    indexRef.current = index
  }, [reelLocked, index])

  // restore an unsaved draft on load (so writing survives navigation/refresh)
  useEffect(() => {
    const d = loadDraft()
    if (!d) return
    if (d.text) setValue(d.text)
    if (d.customTitle) setCustomTitle(d.customTitle)
    if (d.image) setImage(d.image)
    if (d.mode) setMode(d.mode)
    if (Array.isArray(d.blocks) && d.blocks.length) setBlocks(d.blocks)
    if (d.coverId) setCoverId(d.coverId)
    if (d.mood) setMood(d.mood)
  }, [])

  // keep the draft persisted as it changes
  useEffect(() => {
    const t = setTimeout(
      () => saveDraft({ text: value, customTitle, image, mode, blocks, coverId, mood }),
      400,
    )
    return () => clearTimeout(t)
  }, [value, customTitle, image, mode, blocks, coverId, mood])

  // the "+" button opens a fresh journal page with a blank title
  useEffect(() => {
    if (!searchParams.get('new')) return
    setMode('journal')
    setCustomTitle('') // '' (not null) → blank title, shows the "title" placeholder
    setBlocks(emptyBlocks())
    setCoverId(null)
    setMood(null)
    setValue('')
    setImage(null)
    setSearchParams({}, { replace: true })
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // grow textarea + track line count (drives the lock / ghost)
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 21
    setLineCount(value === '' ? 0 : Math.round(el.scrollHeight / lh))
  }, [value, mode])

  // scroll wheel / arrow keys move the reel (smoothly, one prompt per gesture)
  useEffect(() => {
    let acc = 0
    const advance = (dir) => {
      if (transitioningRef.current) return
      transitioningRef.current = true
      setDirection(dir > 0 ? 'down' : 'up')
      setPrev(indexRef.current)
      setIndex((i) => (i + dir + PROMPTS.length) % PROMPTS.length)
      setCustomTitle(null)
      setTimeout(() => {
        setPrev(null)
        transitioningRef.current = false
      }, 520)
    }
    const onWheel = (e) => {
      if (lockedRef.current) return // let the textarea scroll natively
      acc += e.deltaY
      if (Math.abs(acc) < 28) return
      advance(acc > 0 ? 1 : -1)
      acc = 0
    }
    const onKey = (e) => {
      if (lockedRef.current) return
      const ae = document.activeElement
      if (ae && ae.classList.contains('chatbox-input')) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        advance(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        advance(-1)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // focus + select-all when entering title edit
  useEffect(() => {
    if (!editing || !editRef.current) return
    const el = editRef.current
    el.textContent = customTitle ?? current.text
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitTitle = () => {
    const t = (editRef.current?.textContent || '').trim()
    // empty stays '' (deliberately title-less) instead of snapping back to the reel
    setCustomTitle(t)
    setEditing(false)
  }

  // back to quick note: if the title is only blank because of the "+", bring the
  // rotating prompt back. A title the user deliberately cleared ('') while already
  // in quick mode is left alone.
  const goQuick = () => {
    if (mode !== 'quick' && customTitle === '') setCustomTitle(null)
    setMode('quick')
  }

  const onTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(false)
    }
  }

  // switch into journal, carrying the quick-note text/image into blocks
  const goJournal = () => {
    const emptyDefault =
      blocks.length === 1 && blocks[0].type === 'text' && !blocks[0].text.trim()
    if (emptyDefault && (value.trim() || image)) {
      const nb = [{ id: newId(), type: 'text', text: value }]
      let cid = null
      if (image) {
        const ib = { id: newId(), type: 'image', src: image, width: null }
        nb.push(ib)
        cid = ib.id
      }
      setBlocks(nb)
      setCoverId(cid)
      setImage(null)
    }
    setMode('journal')
  }

  const save = () => {
    let payload
    if (mode === 'journal') {
      const hasText = blocks.some((b) => b.type === 'text' && b.text.trim())
      const hasImage = blocks.some((b) => b.type === 'image')
      if (!hasText && !hasImage) return
      payload = { prompt: promptText, blocks, coverId, mood }
    } else {
      const text = value.trim()
      if (!text && !image) return
      const built = textToBlocks(value, image)
      payload = { prompt: promptText, blocks: built.blocks, coverId: built.coverId, mood }
    }
    addEntry(payload)
    setEntries(loadEntries())
    setValue('')
    setImage(null)
    setBlocks(emptyBlocks())
    setCoverId(null)
    setCustomTitle(null)
    setMood(null)
    clearDraft()
    toast(SAVE_LINES[Math.floor(Math.random() * SAVE_LINES.length)])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save()
    }
  }

  const readImageFile = (file) => {
    fileToDataURL(file).then((src) => {
      if (src) setImage(src)
    })
  }

  const onPaste = (e) => {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith('image/'))
    if (item) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) readImageFile(file)
    }
  }

  return (
    <div className="app">
      <div className="star-deco star1" style={{ backgroundImage: `url(${star1})` }} />
      <div className="star-deco star2" style={{ backgroundImage: `url(${star2})` }} />

      <CornerSparkle />

      <div className="top-row">
        <div className="streak-wrap">
          <FireIcon color={didToday ? '#FFABE7' : '#7E8B84'} />
          <span className="day-label">{dayStreak} day streak</span>
        </div>
        <TopNav />
      </div>

      {/* the mode toggle (bottom-left) + room on the right for future tools */}
      {(() => {
        const bar = (
          <div className="composer-bar">
            <div className="mode-toggle">
              <button
                className={mode === 'quick' ? 'active' : ''}
                onClick={goQuick}
              >
                quick note
              </button>
              <button
                className={mode === 'journal' ? 'active' : ''}
                onClick={goJournal}
              >
                journal
              </button>
            </div>
            <div className="bar-right">
              {mode === 'journal' && <MoodPicker value={mood} onChange={setMood} />}
              {mode === 'journal' && (
                <button className="seal-btn" onClick={save}>
                  seal ↳
                </button>
              )}
              <button
                className="mic-btn"
                onClick={() => toast('voice notes — coming soon')}
                title="voice notes — coming soon"
                aria-label="voice note"
              >
                <MicIcon />
              </button>
            </div>
          </div>
        )

        const imagePreview = image && (
          <div className="chatbox-image">
            <img src={image} alt="attached" />
            <button
              className="chatbox-image-remove"
              onClick={() => setImage(null)}
              aria-label="remove image"
            >
              ×
            </button>
          </div>
        )

        // the editable title (shared by both modes)
        const editableTitle = (
          <span className="title-edit">
            <span
              ref={editRef}
              className="prompt-text title-input"
              contentEditable
              suppressContentEditableWarning
              onKeyDown={onTitleKeyDown}
              onBlur={commitTitle}
            />
            <i className="handle tl" />
            <i className="handle tr" />
            <i className="handle bl" />
            <i className="handle br" />
          </span>
        )

        if (mode === 'journal') {
          return (
            <div className="content-wrap">
              <div className="journal-page">
                <div className="journal-title-wrap">
                  {editing ? (
                    editableTitle
                  ) : (
                    <div
                      className="prompt-text journal-title"
                      onClick={() => setEditing(true)}
                      title="click to edit the title"
                    >
                      {promptText ? (
                        renderPrompt(promptText, promptGlow)
                      ) : (
                        <span className="title-placeholder">title</span>
                      )}
                    </div>
                  )}
                </div>

                {bar}

                <BlockEditor
                  blocks={blocks}
                  coverId={coverId}
                  onChange={setBlocks}
                  onSetCover={setCoverId}
                />
              </div>
            </div>
          )
        }

        return (
          <div className="content-wrap">
            <div className="prompt-wrap">
              {showGhost && (
                <div className="prompt-ghost-wrap">
                  <div className="prompt-ghost">{ghostText}</div>
                </div>
              )}

              {editing ? (
                editableTitle
              ) : (
                <div className="prompt-stage">
                  {prev !== null && (
                    <div
                      className={`prompt-text prompt-layer leave-${direction}`}
                      key={`leave-${prev}`}
                    >
                      {renderPrompt(PROMPTS[prev].text, PROMPTS[prev].glow)}
                    </div>
                  )}
                  <div
                    className={`prompt-text prompt-layer ${prev !== null ? `enter-${direction}` : ''}`}
                    key={`cur-${index}-${customTitle ?? ''}`}
                    onClick={() => setEditing(true)}
                    title="click to write your own title"
                  >
                    {renderPrompt(promptText, promptGlow)}
                  </div>
                </div>
              )}
            </div>

            <div className="chat-area">
              <div className="chatbox">
                {imagePreview}
                <div className="chatbox-row">
                  <textarea
                    ref={taRef}
                    className="chatbox-input"
                    rows={1}
                    placeholder="start typing..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                  />
                  <button className="send-wrap" onClick={save} aria-label="save entry">
                    <SendStar />
                  </button>
                </div>
              </div>

              {bar}

              <div className="archive-preview">
                <SparkleMini />
                <span className="archive-label">{weekTotal} entries this week</span>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
