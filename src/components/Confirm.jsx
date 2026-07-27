import { createContext, useCallback, useContext, useRef, useState } from 'react'

// In-app confirm styled as the yellow sticky note (design system §16).
// Usage: const confirm = useConfirm(); if (await confirm('sure?')) { ... }

const ConfirmContext = createContext(async () => true)
export function useConfirm() {
  return useContext(ConfirmContext)
}

function randomTilt() {
  const magnitude = 1.5 + Math.random() * 2
  return (Math.random() < 0.5 ? -1 : 1) * magnitude
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve
      setState({
        message,
        confirmLabel: opts.confirmLabel || 'leave without saving',
        cancelLabel: opts.cancelLabel || 'keep writing',
        tilt: randomTilt(),
      })
    })
  }, [])

  const close = (result) => {
    setState(null)
    resolver.current?.(result)
    resolver.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-backdrop" onClick={() => close(false)}>
          <div
            className="confirm-note"
            style={{ '--tilt': `${state.tilt}deg` }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
          >
            <p className="confirm-msg">{state.message}</p>
            <div className="confirm-actions">
              <button className="confirm-leave" onClick={() => close(true)}>
                {state.confirmLabel}
              </button>
              <button className="confirm-stay" onClick={() => close(false)}>
                {state.cancelLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
