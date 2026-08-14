import { useEffect, useRef, useState } from 'react'

// the mood set (order = display order). `color` is what the face "colours in" to.
export const MOODS = [
  { id: 'refreshed', label: 'refreshed', color: '#77FF94' },
  { id: 'frustrated', label: 'frustrated', color: '#F5B94E' },
  { id: 'enraged', label: 'enraged', color: '#FF6B6B' },
  { id: 'inspired', label: 'inspired / creative', color: '#FFABE7' },
  { id: 'unsure', label: "idk how i feel, i'll figure it out", color: '#9DB3A6' },
]

export const moodMeta = (id) => MOODS.find((m) => m.id === id) || null

// expression per mood — eyes/brows/mouth drawn over the face circle
function Features({ mood }) {
  switch (mood) {
    case 'refreshed':
      return (
        <>
          <path d="M7.6 10.7 Q9 9.4 10.4 10.7" />
          <path d="M13.6 10.7 Q15 9.4 16.4 10.7" />
          <path d="M8.5 13.8 Q12 16.4 15.5 13.8" />
        </>
      )
    case 'frustrated':
      return (
        <>
          <circle cx="9" cy="11" r="0.95" />
          <circle cx="15" cy="11" r="0.95" />
          <path d="M7.3 8.7 L10 9.5" />
          <path d="M16.7 8.7 L14 9.5" />
          <path d="M8.6 15 Q10.5 13.9 12 15 Q13.5 16.1 15.4 15" />
        </>
      )
    case 'enraged':
      return (
        <>
          <circle cx="9" cy="11.4" r="0.95" />
          <circle cx="15" cy="11.4" r="0.95" />
          <path d="M7.3 9.3 L10.2 10.5" />
          <path d="M16.7 9.3 L13.8 10.5" />
          <path d="M8.5 16 Q12 13.6 15.5 16" />
        </>
      )
    case 'inspired':
      return (
        <>
          <path d="M7.6 8.9 Q9 8 10.4 8.9" />
          <path d="M13.6 8.9 Q15 8 16.4 8.9" />
          <circle cx="9" cy="11" r="0.95" />
          <circle cx="15" cy="11" r="0.95" />
          <path d="M8 13.3 Q12 17.2 16 13.3" />
        </>
      )
    case 'unsure':
      return (
        <>
          <circle cx="9" cy="10.9" r="0.95" />
          <circle cx="15" cy="10.9" r="0.95" />
          <path d="M8.5 14.9 Q10 13.7 11.5 14.9 Q13 16.1 15.5 14.9" />
        </>
      )
    default: // neutral smiley for the empty trigger
      return (
        <>
          <circle cx="9" cy="10.8" r="0.95" />
          <circle cx="15" cy="10.8" r="0.95" />
          <path d="M8.5 14 Q12 16.4 15.5 14" />
        </>
      )
  }
}

export function MoodFace({ mood, color, filled = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`mood-face${filled ? ' filled' : ''} ${className}`}
      style={{ '--c': color }}
      aria-hidden="true"
    >
      <circle className="mf-fill" cx="12" cy="12" r="9" />
      <circle className="mf-ring" cx="12" cy="12" r="9" />
      <g className="mf-feat">
        <Features mood={mood} />
      </g>
    </svg>
  )
}

// the empty-state trigger icon (a line smiley in muted cream)
const EMPTY_COLOR = 'rgba(247, 244, 213, 0.7)'

export default function MoodPicker({ value, onChange, align = 'left' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = moodMeta(value)

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (id) => {
    onChange(id === value ? null : id)
    // hold the panel open a beat so the colour-in animation is visible
    setTimeout(() => setOpen(false), 640)
  }

  return (
    <div className={`mood-picker ${align}`} ref={ref}>
      <button
        type="button"
        className={`mood-trigger${selected ? ' has-mood' : ''}`}
        onClick={() => setOpen((o) => !o)}
        title={selected ? `mood: ${selected.label}` : 'how are you feeling?'}
        aria-label="pick a mood"
        aria-expanded={open}
      >
        {selected ? (
          <MoodFace key={selected.id} mood={selected.id} color={selected.color} filled />
        ) : (
          <MoodFace mood="default" color={EMPTY_COLOR} />
        )}
      </button>

      {open && (
        <div className="mood-panel" role="menu">
          <div className="mood-panel-head">how are you feeling?</div>
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mood-opt${value === m.id ? ' active' : ''}`}
              onClick={() => pick(m.id)}
              role="menuitemradio"
              aria-checked={value === m.id}
            >
              <MoodFace
                key={`${m.id}-${value === m.id}`}
                mood={m.id}
                color={m.color}
                filled={value === m.id}
              />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
