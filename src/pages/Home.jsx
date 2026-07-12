import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import star1 from '../assets/star1.png'
import star2 from '../assets/star2.png'
import { addEntry, loadEntries, streak, weekCount } from '../lib/storage'
import { ArchiveIcon, DotStar, FireIcon, SendStar } from '../components/icons'

const CURRENT_PROMPT = 'what did i notice today?'
const NEXT_PROMPT = 'what am i proud of today?'

export default function Home() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState(loadEntries)
  const [value, setValue] = useState('')
  const [image, setImage] = useState(null)
  const taRef = useRef(null)

  const weekTotal = useMemo(() => weekCount(entries), [entries])
  const dayStreak = useMemo(() => streak(entries), [entries])

  // grow the textarea to fit its content, like a chat composer
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  const save = () => {
    const text = value.trim()
    if (!text && !image) return
    addEntry({ prompt: CURRENT_PROMPT, text, image })
    setEntries(loadEntries())
    setValue('')
    setImage(null)
  }

  const onKeyDown = (e) => {
    // Enter saves; Shift+Enter inserts a newline
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
            <div className="prompt-ghost">{NEXT_PROMPT}</div>
          </div>
          <div className="prompt-text">
            what did i <span className="highlight-word">notice</span> today?
          </div>
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
            <DotStar />
            <span className="archive-label">{weekTotal} entries this week</span>
          </div>
        </div>
      </div>
    </div>
  )
}
