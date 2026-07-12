import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import star1 from '../assets/star1.png'
import star2 from '../assets/star2.png'
import { addEntry, loadEntries, streak, weekCount } from '../lib/storage'
import { ArchiveIcon, FireIcon, SendStar, SparkleMini } from '../components/icons'

// The rotation. `glow` is the word rendered in green — swap these freely later.
const PROMPTS = [
  { text: 'what did i notice today?', glow: 'notice' },
  { text: 'what am i proud of today?', glow: 'proud' },
  { text: 'letter to my future self', glow: 'future' },
  { text: 'something to bring up in therapy next', glow: 'therapy' },
  { text: 'what felt heavy today?', glow: 'heavy' },
  { text: 'what made me laugh recently?', glow: 'laugh' },
  { text: 'a small thing worth remembering', glow: 'remembering' },
]

// render a prompt with its glow word wrapped, if any
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
  const navigate = useNavigate()
  const [entries, setEntries] = useState(loadEntries)
  const [value, setValue] = useState('')
  const [image, setImage] = useState(null)

  // prompt reel
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('down')
  // custom title overrides the rotation prompt until the user scrolls
  const [customTitle, setCustomTitle] = useState(null)
  const [editing, setEditing] = useState(false)

  const taRef = useRef(null)
  const editRef = useRef(null)
  const editingRef = useRef(false)
  useEffect(() => {
    editingRef.current = editing
  }, [editing])

  const weekTotal = useMemo(() => weekCount(entries), [entries])
  const dayStreak = useMemo(() => streak(entries), [entries])

  const current = PROMPTS[index]
  const promptText = customTitle ?? current.text
  const promptGlow = customTitle ? null : current.glow
  const ghostText = PROMPTS[(index + 1) % PROMPTS.length].text

  // grow the textarea to fit its content, like a chat composer
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // advance the reel (scroll wheel / arrow keys)
  useEffect(() => {
    let locked = false
    let acc = 0
    const advance = (dir) => {
      setDirection(dir > 0 ? 'down' : 'up')
      setIndex((i) => (i + dir + PROMPTS.length) % PROMPTS.length)
      setCustomTitle(null)
    }
    const onWheel = (e) => {
      if (editingRef.current) return
      acc += e.deltaY
      if (locked || Math.abs(acc) < 24) return
      advance(acc > 0 ? 1 : -1)
      acc = 0
      locked = true
      setTimeout(() => (locked = false), 340)
    }
    const onKey = (e) => {
      if (editingRef.current) return
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
    setCustomTitle(t || null)
    setEditing(false)
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

  const save = () => {
    const text = value.trim()
    if (!text && !image) return
    addEntry({ prompt: promptText, text, images: image ? [image] : [] })
    setEntries(loadEntries())
    setValue('')
    setImage(null)
    setCustomTitle(null)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save()
    }
  }

  const readImageFile = (file) => {
    const reader = new FileReader()
    reader.onload = () => setImage(reader.result)
    reader.readAsDataURL(file)
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

      <div className="corner-sparkle">*</div>

      <div className="top-row">
        <div className="streak-wrap">
          <FireIcon />
          <span className="day-label">{dayStreak} day streak</span>
        </div>
        <button
          className="icon-button"
          onClick={() => navigate('/archive')}
          aria-label="open archive"
        >
          <ArchiveIcon />
        </button>
      </div>

      <div className="content-wrap">
        <div className="prompt-wrap">
          <div className="prompt-ghost-wrap">
            <div className="prompt-ghost">{ghostText}</div>
          </div>

          {editing ? (
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
          ) : (
            <div
              key={index}
              className={`prompt-text reel-${direction}`}
              onClick={() => setEditing(true)}
              title="click to write your own title"
            >
              {renderPrompt(promptText, promptGlow)}
            </div>
          )}
        </div>

        <div className="chat-area">
          <div className="chatbox">
            {image && (
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
            )}
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

          <div className="archive-preview">
            <SparkleMini />
            <span className="archive-label">{weekTotal} entries this week</span>
          </div>
        </div>
      </div>
    </div>
  )
}
