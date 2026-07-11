import { useEffect, useMemo, useState } from 'react'
import star1 from './assets/star1.png'
import star2 from './assets/star2.png'
import './App.css'

const STORAGE_KEY = 'no-reply-entries'
const CURRENT_PROMPT = 'what did i notice today?'
const NEXT_PROMPT = 'what am i proud of today?'

function loadEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function countStreak(entries) {
  const days = new Set(
    entries.map((e) => new Date(e.timestamp).toDateString()),
  )
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (days.has(cursor.toDateString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function App() {
  const [entries, setEntries] = useState(loadEntries)
  const [value, setValue] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const entriesThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date())
    return entries.filter((e) => new Date(e.timestamp) >= weekStart).length
  }, [entries])

  const streak = useMemo(() => countStreak(entries), [entries])

  const save = () => {
    const text = value.trim()
    if (!text) return
    setEntries((prev) => [
      ...prev,
      { prompt: CURRENT_PROMPT, text, timestamp: Date.now() },
    ])
    setValue('')
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      save()
    }
  }

  return (
    <div className="app">
      <div className="star-deco star1" style={{ backgroundImage: `url(${star1})` }} />
      <div className="star-deco star2" style={{ backgroundImage: `url(${star2})` }} />

      <div className="corner-sparkle">*</div>

      <div className="top-row">
        <div className="streak-wrap">
          <svg className="fire-icon" viewBox="0 0 24 24" fill="#FFABE7">
            <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1.5 1 2 3 2 4.5A6.5 6.5 0 0 1 5 13.5C5 9 8 6 9 4c.3 2 1 2.5 1.5 2.5C11 5 11 3 12 2z" />
          </svg>
          <span className="day-label">{streak} day streak</span>
        </div>
        <svg
          className="archive-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#F7F4D5"
          strokeWidth="1.4"
        >
          <rect x="3" y="7" width="18" height="13" rx="1.5" />
          <path d="M3 7l2-3h14l2 3" />
          <path d="M10 12h4" />
        </svg>
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
            <input
              className="chatbox-input"
              type="text"
              placeholder="start typing..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button className="send-wrap" onClick={save} aria-label="save entry">
              <svg className="send-star" viewBox="0 0 20 20">
                <path
                  d="M10 1 L10 19 M1 10 L19 10 M3.5 3.5 L16.5 16.5 M16.5 3.5 L3.5 16.5"
                  stroke="#FFABE7"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="archive-preview">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="#6B8C76">
              <g>
                <circle cx="50" cy="44" r="1.3" />
                <circle cx="50" cy="38" r="1.3" />
                <circle cx="50" cy="32" r="1.3" />
                <circle cx="50" cy="24" r="1.3" />
                <circle cx="50" cy="18" r="1.3" />
                <circle cx="50" cy="9" r="1.3" />
                <circle cx="56" cy="62" r="1.3" />
                <circle cx="62" cy="68" r="1.3" />
                <circle cx="68" cy="74" r="1.3" />
                <circle cx="76" cy="76" r="1.3" />
                <circle cx="82" cy="82" r="1.3" />
                <circle cx="91" cy="91" r="1.3" />
                <circle cx="38" cy="62" r="1.3" />
                <circle cx="32" cy="68" r="1.3" />
                <circle cx="26" cy="74" r="1.3" />
                <circle cx="18" cy="76" r="1.3" />
                <circle cx="12" cy="82" r="1.3" />
                <circle cx="3" cy="91" r="1.3" />
                <circle cx="50" cy="50" r="1.8" />
              </g>
            </svg>
            <span className="archive-label">{entriesThisWeek} entries this week</span>
          </div>
        </div>
      </div>
    </div>
  )
}
