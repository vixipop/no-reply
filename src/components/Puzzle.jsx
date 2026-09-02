import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePuzzle } from '../lib/puzzle'
import { playSnap } from '../lib/snapSound'
import shipUrl from '../assets/puzzle/ship.png'
import foamUrl from '../assets/puzzle/foam.png'

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

const SNAP = 26 // px of slack before pieces click together / into the frame

const CORE = 9 // px of exposed foam thickness along the bottom/right edge

// shared textures for every piece — defined once, referenced by all
function PuzzleDefs() {
  return (
    <svg className="pz-defs" width="0" height="0" aria-hidden="true">
      <defs>
        {/* real open-cell sponge photo, tiled, for the side of each piece */}
        <pattern id="pz-foam" width="82" height="82" patternUnits="userSpaceOnUse">
          <image href={foamUrl} x="0" y="0" width="82" height="82" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        {/* darken the bottom of the foam band so it reads as a rounded side */}
        <linearGradient id="pz-core-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e2016" stopOpacity="0" />
          <stop offset="0.5" stopColor="#0e2016" stopOpacity="0.14" />
          <stop offset="1" stopColor="#081408" stopOpacity="0.55" />
        </linearGradient>
        {/* enrich the printed artwork so it doesn't look washed out */}
        <filter id="pz-print" x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="saturate" values="1.2" />
        </filter>
        {/* soft rounded lip: an inner shadow so the top rolls into the side with no
            hard outline; light reads from the top-left */}
        <filter id="pz-round" x="-25%" y="-25%" width="150%" height="150%">
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="2" />
          <feOffset dx="0.6" dy="1.3" result="sh" />
          <feComposite in="sh" in2="SourceAlpha" operator="in" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.05  0 0 0 0 0.09  0 0 0 0 0.06  0 0 0 0.85 0" />
        </filter>
        {/* faint top-left highlight for the domed 3D feel */}
        <filter id="pz-round-hi" x="-25%" y="-25%" width="150%" height="150%">
          <feComponentTransfer in="SourceAlpha">
            <feFuncA type="table" tableValues="1 0" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="1.7" />
          <feOffset dx="-0.7" dy="-1.1" result="hi" />
          <feComposite in="hi" in2="SourceAlpha" operator="in" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 0.96  0 0 0 0.32 0" />
        </filter>
      </defs>
    </svg>
  )
}

function Piece({ p, image, aW, aH, register, onDown }) {
  const { w, h } = p.bbox
  const cid = `pzc-${p.id}`
  return (
    <div className="pz-piece" ref={(el) => register(p.id, el)} onPointerDown={(e) => onDown(e, p)}>
      <svg width={w} height={h + CORE} viewBox={`0 0 ${w} ${h + CORE}`} className="pz-svg">
        <defs>
          <clipPath id={cid}>
            <path d={p.d} />
          </clipPath>
        </defs>
        {/* the chunky foam side, offset down so its thickness shows at the edge */}
        <g transform={`translate(0 ${CORE})`}>
          <path d={p.d} fill="url(#pz-foam)" />
          <path d={p.d} fill="url(#pz-core-shade)" />
        </g>
        {/* printed top face — smooth */}
        <g clipPath={`url(#${cid})`}>
          <image
            href={image}
            x={-p.bbox.x}
            y={-p.bbox.y}
            width={aW}
            height={aH}
            preserveAspectRatio="none"
            filter="url(#pz-print)"
          />
        </g>
        {/* rounded edge shading (no hard outline): a soft dark lip rolling into the
            side, plus a faint top-left highlight for the domed 3D look */}
        <path d={p.d} fill="#000" filter="url(#pz-round)" />
        <path d={p.d} fill="#000" filter="url(#pz-round-hi)" />
      </svg>
    </div>
  )
}

export default function Puzzle({ cols = 6, rows = 8, seed = 42, image = shipUrl, onSolved }) {
  const boardRef = useRef(null)
  const els = useRef({})
  const drag = useRef(null)
  const zTop = useRef(20)
  const pos = useRef({}) // id -> {x,y} (bbox top-left, board coords)
  const groupOf = useRef(new Map()) // id -> gid
  const groupMembers = useRef(new Map()) // gid -> [id]
  const anchored = useRef(new Set()) // gids locked into the frame
  const gidSeq = useRef(0)
  const [board, setBoard] = useState(null)
  const [img, setImg] = useState(null)
  const [placed, setPlaced] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const im = new Image()
    im.onload = () => setImg({ w: im.naturalWidth, h: im.naturalHeight })
    im.src = image
  }, [image])

  useEffect(() => {
    const measure = () => {
      if (boardRef.current) setBoard({ w: boardRef.current.clientWidth, h: boardRef.current.clientHeight })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const layout = useMemo(() => {
    if (!board || !img) return null
    let aH = Math.min(board.h * 0.74, 540)
    let aW = aH * (img.w / img.h)
    const maxW = board.w * 0.5 // leave generous side margins to pile loose pieces
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

  const paint = (id) => {
    const el = els.current[id]
    const q = pos.current[id]
    if (el && q) {
      el.style.left = `${q.x}px`
      el.style.top = `${q.y}px`
    }
  }

  // scatter pieces once we have a layout; every piece starts in its own group.
  // Pieces pile in the left/right margins so the assembly rectangle stays clear.
  useEffect(() => {
    if (!layout) return
    const { pz, originX, originY, aW, aH } = layout
    const r = rng(seed * 7 + 3)
    pos.current = {}
    groupOf.current = new Map()
    groupMembers.current = new Map()
    anchored.current = new Set()
    gidSeq.current = 0
    const bw = pz.pieces[0].bbox.w
    const bh = pz.pieces[0].bbox.h
    // left band: [gap, originX - bw]; right band: [originX + aW, board.w - bw]
    const leftHi = Math.max(4, originX - bw - 4)
    const rightLo = Math.min(board.w - bw - 4, originX + aW + 4)
    const rightHi = Math.max(rightLo, board.w - bw - 4)
    const yHi = Math.max(4, board.h - bh - 4)
    pz.pieces.forEach((p, i) => {
      const left = i % 2 === 0
      const x = left ? 4 + r() * Math.max(1, leftHi - 4) : rightLo + r() * Math.max(1, rightHi - rightLo)
      const y = 4 + r() * yHi
      pos.current[p.id] = { x, y }
      const gid = gidSeq.current++
      groupOf.current.set(p.id, gid)
      groupMembers.current.set(gid, [p.id])
    })
    setTotal(pz.pieces.length)
    setPlaced(0)
    requestAnimationFrame(() => {
      pz.pieces.forEach((p) => {
        paint(p.id)
        const el = els.current[p.id]
        if (el) {
          el.classList.remove('placed')
          el.style.zIndex = 20
        }
      })
    })
  }, [layout, board, seed])

  // all the snap logic lives in one place, closing over the current layout
  useEffect(() => {
    if (!layout) return
    const byId = {}
    layout.pz.pieces.forEach((p) => {
      byId[p.id] = p
    })
    const neighbors = (id) => {
      const p = byId[id]
      return [`${p.row - 1}-${p.col}`, `${p.row + 1}-${p.col}`, `${p.row}-${p.col - 1}`, `${p.row}-${p.col + 1}`].filter(
        (n) => byId[n],
      )
    }
    const shift = (gid, dx, dy) => {
      groupMembers.current.get(gid).forEach((id) => {
        pos.current[id].x += dx
        pos.current[id].y += dy
        paint(id)
      })
    }
    const union = (a, b) => {
      if (a === b) return a
      const ma = groupMembers.current.get(a)
      const mb = groupMembers.current.get(b)
      const [keep, drop] = ma.length >= mb.length ? [a, b] : [b, a]
      groupMembers.current.get(drop).forEach((id) => {
        groupOf.current.set(id, keep)
        groupMembers.current.get(keep).push(id)
      })
      if (anchored.current.has(drop)) anchored.current.add(keep)
      anchored.current.delete(drop)
      groupMembers.current.delete(drop)
      return keep
    }
    // merge any adjacent pieces from different groups that are already aligned
    const mergeExact = () => {
      let changed = true
      while (changed) {
        changed = false
        for (const id of Object.keys(pos.current)) {
          const g = groupOf.current.get(id)
          for (const n of neighbors(id)) {
            if (groupOf.current.get(n) === g) continue
            const hx = byId[id].home.x - byId[n].home.x
            const hy = byId[id].home.y - byId[n].home.y
            if (
              Math.abs(pos.current[n].x + hx - pos.current[id].x) < 2 &&
              Math.abs(pos.current[n].y + hy - pos.current[id].y) < 2
            ) {
              union(g, groupOf.current.get(n))
              changed = true
            }
          }
        }
      }
    }
    const lock = (gid) => {
      groupMembers.current.get(gid).forEach((id) => {
        const el = els.current[id]
        if (el) {
          el.classList.add('placed')
          el.style.zIndex = 2
        }
      })
    }
    const recount = () => {
      let n = 0
      anchored.current.forEach((gid) => {
        const m = groupMembers.current.get(gid)
        if (m) n += m.length
      })
      setPlaced(n)
      if (n === layout.pz.pieces.length && n > 0) onSolved?.()
    }

    const finalize = (gid) => {
      const members = groupMembers.current.get(gid)
      const groupsBefore = groupMembers.current.size
      let anchoredBefore = 0
      anchored.current.forEach((g) => {
        anchoredBefore += groupMembers.current.get(g)?.length || 0
      })
      // nearest cross-group connection
      let best = null
      members.forEach((id) => {
        neighbors(id).forEach((n) => {
          if (groupOf.current.get(n) === gid) return
          const hx = byId[id].home.x - byId[n].home.x
          const hy = byId[id].home.y - byId[n].home.y
          const dx = pos.current[n].x + hx - pos.current[id].x
          const dy = pos.current[n].y + hy - pos.current[id].y
          const dist = Math.hypot(dx, dy)
          if (dist < SNAP && (!best || dist < best.dist)) best = { dx, dy, dist }
        })
      })
      // nearest slot in the frame (so you can also just drop pieces into place)
      let frame = null
      members.forEach((id) => {
        const dx = layout.originX + byId[id].home.x - pos.current[id].x
        const dy = layout.originY + byId[id].home.y - pos.current[id].y
        const dist = Math.hypot(dx, dy)
        if (dist < SNAP && (!frame || dist < frame.dist)) frame = { dx, dy, dist }
      })
      if (frame && (!best || frame.dist <= best.dist)) shift(gid, frame.dx, frame.dy)
      else if (best) shift(gid, best.dx, best.dy)
      mergeExact()
      // anchor+lock any group that is now sitting in its true frame position
      for (const gg of [...groupMembers.current.keys()]) {
        const id = groupMembers.current.get(gg)[0]
        const dx = layout.originX + byId[id].home.x - pos.current[id].x
        const dy = layout.originY + byId[id].home.y - pos.current[id].y
        if (Math.hypot(dx, dy) < 2) {
          anchored.current.add(gg)
          lock(gg)
        }
      }
      // a real connection happened if groups merged or new pieces locked in
      let anchoredAfter = 0
      anchored.current.forEach((g) => {
        anchoredAfter += groupMembers.current.get(g)?.length || 0
      })
      if (groupMembers.current.size < groupsBefore || anchoredAfter > anchoredBefore) {
        playSnap()
      }
      recount()
    }

    // keep the dragged group fully inside the board so pieces can't be lost
    const clamp = (d, dx, dy) => {
      const b = d.bounds
      const cx = Math.min(Math.max(dx, -b.minX), Math.max(-b.minX, d.bw - b.maxRight))
      const cy = Math.min(Math.max(dy, -b.minY), Math.max(-b.minY, d.bh - b.maxBottom))
      return [cx, cy]
    }
    const onMove = (e) => {
      const d = drag.current
      if (!d) return
      const [dx, dy] = clamp(d, e.clientX - d.sx, e.clientY - d.sy)
      groupMembers.current.get(d.gid).forEach((id) => {
        const el = els.current[id]
        el.style.left = `${d.start[id].x + dx}px`
        el.style.top = `${d.start[id].y + dy}px`
      })
    }
    const onUp = (e) => {
      const d = drag.current
      if (!d) return
      drag.current = null
      const [dx, dy] = clamp(d, e.clientX - d.sx, e.clientY - d.sy)
      groupMembers.current.get(d.gid).forEach((id) => {
        pos.current[id] = { x: d.start[id].x + dx, y: d.start[id].y + dy }
      })
      finalize(d.gid)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [layout, onSolved])

  const onDown = (e, p) => {
    const gid = groupOf.current.get(p.id)
    if (gid === undefined || anchored.current.has(gid)) return
    const bw = p.bbox.w
    const bh = p.bbox.h + CORE
    let minX = Infinity
    let minY = Infinity
    let maxRight = -Infinity
    let maxBottom = -Infinity
    const start = {}
    groupMembers.current.get(gid).forEach((id) => {
      const q = pos.current[id]
      start[id] = { x: q.x, y: q.y }
      minX = Math.min(minX, q.x)
      minY = Math.min(minY, q.y)
      maxRight = Math.max(maxRight, q.x + bw)
      maxBottom = Math.max(maxBottom, q.y + bh)
      zTop.current += 1
      els.current[id].style.zIndex = zTop.current
    })
    const el = boardRef.current
    drag.current = {
      gid,
      sx: e.clientX,
      sy: e.clientY,
      start,
      bounds: { minX, minY, maxRight, maxBottom },
      bw: el.clientWidth,
      bh: el.clientHeight,
    }
    els.current[p.id].setPointerCapture?.(e.pointerId)
  }

  return (
    <div className="pz-wrap">
      <div className="pz-progress">
        {placed} / {total} pieces
      </div>
      <div className="pz-board" ref={boardRef}>
        <PuzzleDefs />
        {layout && (
          <div
            className="pz-target"
            style={{ left: layout.originX, top: layout.originY, width: layout.aW, height: layout.aH }}
          />
        )}
        {layout &&
          layout.pz.pieces.map((p) => (
            <Piece
              key={p.id}
              p={p}
              image={image}
              aW={layout.aW}
              aH={layout.aH}
              register={register}
              onDown={onDown}
            />
          ))}
        {placed === total && total > 0 && <div className="pz-solved">solved ✶</div>}
      </div>
    </div>
  )
}
