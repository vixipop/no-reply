import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { BottleIcon } from './icons'

// All toasts/notifications in the app use this one look (yellow sticky note,
// randomized tilt) — see CONTEXT.md §16. Use `const toast = useToast()` then
// `toast('message')`.

const ToastContext = createContext(() => {})
export function useToast() {
  return useContext(ToastContext)
}

let counter = 0

// tilt: ±1.5°–3.5°, always off-zero so it reads hand-placed
function randomTilt() {
  const magnitude = 1.5 + Math.random() * 2
  return (Math.random() < 0.5 ? -1 : 1) * magnitude
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message) => {
    const id = ++counter
    setToasts((list) => [...list, { id, message, tilt: randomTilt() }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-host">
        {toasts.map((t) => (
          <StickyToast key={t.id} message={t.message} tilt={t.tilt} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function StickyToast({ message, tilt }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // enter on next frame, start exit before the provider unmounts it
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)))
    const exit = setTimeout(() => setShow(false), 2600)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(exit)
    }
  }, [])

  return (
    <div
      className={`toast sticky${show ? ' show' : ''}`}
      style={{ '--tilt': `${tilt}deg` }}
      role="status"
    >
      <BottleIcon />
      <span className="msg">{message}</span>
    </div>
  )
}
