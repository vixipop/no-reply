import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePuzzle } from '../lib/puzzle'
import shipUrl from '../assets/puzzle/ship.png'

// tiny seeded rng for the scatter, so a given puzzle always lays out the same way
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SNAP = 24 // px within home before a piece clicks into place

function Piece({ p, image, aW, aH, index, register, onDown }) {
  const { w, h } = p.bbox
  const cid = `pzc-${p.id}`
  const fid = `pzf-${p.id}`
  return (
    <div
      className="pz-piece"
      ref={(el) => register(p.id, el)}
      onPointerDown={(e) => onDown(e, p)}
    >
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="pz-svg">
        <defs>
          <clipPath id={cid}>
            <path d={p.d} />
          </clipPath>
          {/* fibrous cardboard grain, unique per piece so it never tiles visibly */}
          <filter id={fid}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="2"
              seed={index * 7 + 1}
              stitchTiles="stitch"
              result="n"
            />
            <feColorMatrix
              in="n"
              type="matrix"
              values="0 0 0 0 0.42  0 0 0 0 0.37  0 0 0 0 0.27  0 0 0 0.9 0"
            />
          </filter>
        </defs>
        <g clipPath={`url(#${cid})`}>
          <image
            href={image}
            x={-p.bbox.x}
            y={-p.bbox.y}
            width={aW}
            height={aH}
            preserveAspectRatio="none"
          />
          {/* matte cardboard grain over the print */}
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            filter={`url(#${fid})`}
            opacity="0.15"
            style={{ mixBlendMode: 'multiply' }}
          />
        </g>
        {/* die-cut edge: a warm cardboard-core rim + a thin dark line for depth */}
        <path d={p.d} fill="none" stroke="#e7dab6" strokeWidth="1.5" strokeOpacity="0.5" />
        <path d={p.d} fill="none" stroke="#2c2413" strokeWidth="0.8" strokeOpacity="0.32" />
      </svg>
    </div>
  )
}

export default function Puzzle({ cols = 6, rows = 8, seed = 42, image = shipUrl, onSolved }) {
  const boardRef = useRef(null)
  const els = useRef({})
  const drag = useRef(null)
  const zTop = useRef(20)
  const posRef = useRef({}) // id -> {x,y,placed}
  const [board, setBoard] = useState(null)
  const [img, setImg] = useState(null)
  const [placed, setPlaced] = useState(0)
  const [ready, setReady] = useState(false)

  // natural image size
  useEffect(() => {
    const im = new Image()
    im.onload = () => setImg({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = image
  }, [image])

  // measure the board
  useEffect(() => {
    const measure = () => {
      if (boardRef.current) setBoard({ w: boardRef.current.clientWidth, h: boardRef.current.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // assembled area + geometry
  const layout = useMemo(() => {
    if (!board || !img) return null
    const availW = board.w
    const availH = board.h
    let aH = Math.min(availH * 0.74, 540)
    let aW = aH * (img.w / img.h)
    const maxW = availW * 0.6
    if (aW > maxW) {
      aW = maxW
      aH = aW * (img.h / img.w)
    }
    const originX = (board.w - aW) / 2
    const originY = (board.h - aH) / 2
    const pz = generatePuzzle({ width: aW, height: aH, cols, rows, seed })
    return { pz, aW, aH, originX, originY }
  }, [board, img, cols, rows, seed])

  const register = (id, el) => {
    if (el) els.current[id] = el
    else delete els.current[id]
  }

  const place = (el, x, y) => {
    el.style.left = `${x}px`
    el.style.top = `${y}px`
  }

  // scatter pieces once we have a layout, and paint their start positions
  useEffect(() => {
    if (!layout) return
    setReady(false)
    const { pz } = layout
    const r = rng(seed * 7 + 3)
    const next = {}
    pz.pieces.forEach((p) => {
      const x = 6 + r() * Math.max(1, board.w - p.bbox.w - 12)
      const y = 6 + r() * Math.max(1, board.h - p.bbox.h - 12)
      next[p.id] = { x, y, placed: false }
    })
    posRef.current = next
    setPlaced(0)
    // paint after the DOM nodes exist
    requestAnimationFrame(() => {
      pz.pieces.forEach((p) => {
        const el = els.current[p.id]
        if (el) {
          place(el, next[p.id].x, next[p.id].y)
          el.classList.remove('placed')
          el.style.zIndex = 20
        }
      })
      setReady(true)
    })
  }, [layout, board, seed])

  // one set of window listeners for the whole drag lifecycle
  useEffect(() => {
    const onMove = (e) => {
      const d = drag.current
      if (!d) return
      place(d.el, e.clientX - d.dx, e.clientY - d.dy)
    }
    const onUp = () => {
      const d = drag.current
      if (!d || !layout) return
      drag.current = null
      const el = d.el
      const x = parseFloat(el.style.left)
      const y = parseFloat(el.style.top)
      const p = layout.pz.pieces.find((pp) => pp.id === d.id)
      const homeX = layout.originX + p.home.x
      const homeY = layout.originY + p.home.y
      if (Math.hypot(x - homeX, y - homeY) < SNAP) {
        place(el, homeX, homeY)
        el.classList.add('placed')
        el.style.zIndex = 2
        if (!posRef.current[d.id].placed) {
          posRef.current[d.id].placed = true
          setPlaced((n) => {
            const total = n + 1
            if (total === layout.pz.pieces.length) onSolved?.()
            return total
          })
        }
      } else {
        posRef.current[d.id] = { x, y, placed: false }
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [layout, onSolved])

  const onDown = (e, p) => {
    if (posRef.current[p.id]?.placed) return
    const el = els.current[p.id]
    const x = parseFloat(el.style.left)
    const y = parseFloat(el.style.top)
    drag.current = { id: p.id, el, dx: e.clientX - x, dy: e.clientY - y }
    zTop.current += 1
    el.style.zIndex = zTop.current
    el.setPointerCapture?.(e.pointerId)
  }

  const total = layout ? layout.pz.pieces.length : 0

  return (
    <div className="pz-wrap">
      <div className="pz-progress">
        {placed} / {total} pieces
      </div>
      <div className="pz-board" ref={boardRef}>
        {layout && (
          <div
            className="pz-target"
            style={{
              left: layout.originX,
              top: layout.originY,
              width: layout.aW,
              height: layout.aH,
            }}
          />
        )}
        {layout &&
          layout.pz.pieces.map((p, i) => (
            <Piece
              key={p.id}
              p={p}
              index={i}
              image={image}
              aW={layout.aW}
              aH={layout.aH}
              register={register}
              onDown={onDown}
            />
          ))}
        {ready && placed === total && total > 0 && (
          <div className="pz-solved">solved ✶</div>
        )}
      </div>
    </div>
  )
}
