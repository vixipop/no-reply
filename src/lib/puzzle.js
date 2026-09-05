// Jigsaw geometry generator.
//
// Given an image size and a grid (cols × rows), this produces one SVG path per
// piece with real interlocking edges: every internal edge is generated once,
// with a random tab direction and a little jitter, and shared by the two pieces
// that meet along it — so a tab on one piece is exactly the blank on its
// neighbour. Border edges are straight. Each piece also carries its bounding box
// (padded to hold the tabs) and its "home" position in the assembled picture.

function mulberry32(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A single jigsaw knob as cubic beziers, in normalised edge space:
// t runs 0→1 along the edge, o is the perpendicular offset (o>0 = tab side).
// Neck pinches in around the middle, the head balloons out past it → the classic
// interlocking bulge.
const KNOB = [
  [0.13, 0.0, 0.25, 0.0, 0.38, 0.0], // straight run to the neck (left)
  [0.34, 0.1, 0.34, 0.22, 0.42, 0.26], // up into the head (undercut, left side)
  [0.46, 0.29, 0.54, 0.29, 0.58, 0.26], // over the round top
  [0.66, 0.22, 0.66, 0.1, 0.62, 0.0], // down out of the head (mirror, right side)
  [0.75, 0.0, 0.87, 0.0, 1.0, 0.0], // straight run to the end (right)
]

export function generatePuzzle({ width, height, cols, rows, seed = 1 }) {
  const rnd = mulberry32(seed)
  const cw = width / cols
  const ch = height / rows

  // an internal edge from corner (sx,sy) → (ex,ey), as absolute-coordinate beziers
  const buildEdge = (sx, sy, ex, ey) => {
    const sign = rnd() < 0.5 ? 1 : -1
    const scale = 0.9 + rnd() * 0.25 // vary knob height a touch, for organic pieces
    const L = Math.hypot(ex - sx, ey - sy)
    const dx = (ex - sx) / L
    const dy = (ey - sy) / L
    const px = dy // perpendicular unit (rotate dir by -90°)
    const py = -dx
    const map = (t, o) => [
      sx + (ex - sx) * t + px * o * scale * L * sign,
      sy + (ey - sy) * t + py * o * scale * L * sign,
    ]
    const segs = KNOB.map((k) => ({
      c1: map(k[0], k[1]),
      c2: map(k[2], k[3]),
      end: map(k[4], k[5]),
    }))
    return { start: [sx, sy], segs }
  }

  // internal horizontal edges HE[line][col] and vertical edges VE[line][row]
  const HE = {}
  const VE = {}
  for (let line = 1; line < rows; line += 1) {
    HE[line] = []
    for (let c = 0; c < cols; c += 1) HE[line][c] = buildEdge(c * cw, line * ch, (c + 1) * cw, line * ch)
  }
  for (let line = 1; line < cols; line += 1) {
    VE[line] = []
    for (let r = 0; r < rows; r += 1) VE[line][r] = buildEdge(line * cw, r * ch, line * cw, (r + 1) * ch)
  }

  const f = (p, bx, by) => `${(p[0] - bx).toFixed(2)} ${(p[1] - by).toFixed(2)}`
  const fwd = (edge, bx, by) =>
    edge.segs.map((s) => `C ${f(s.c1, bx, by)} ${f(s.c2, bx, by)} ${f(s.end, bx, by)}`).join(' ')
  const rev = (edge, bx, by) => {
    const out = []
    for (let i = edge.segs.length - 1; i >= 0; i -= 1) {
      const prev = i === 0 ? edge.start : edge.segs[i - 1].end
      out.push(`C ${f(edge.segs[i].c2, bx, by)} ${f(edge.segs[i].c1, bx, by)} ${f(prev, bx, by)}`)
    }
    return out.join(' ')
  }

  const pad = 0.36 * Math.max(cw, ch) // room for tabs that overhang the cell
  const pieces = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const bx = c * cw - pad
      const by = r * ch - pad
      const TL = [c * cw, r * ch]
      const TR = [(c + 1) * cw, r * ch]
      const BR = [(c + 1) * cw, (r + 1) * ch]
      const BL = [c * cw, (r + 1) * ch]
      let d = `M ${f(TL, bx, by)} `
      d += r === 0 ? `L ${f(TR, bx, by)} ` : `${fwd(HE[r][c], bx, by)} `
      d += c === cols - 1 ? `L ${f(BR, bx, by)} ` : `${fwd(VE[c + 1][r], bx, by)} `
      d += r === rows - 1 ? `L ${f(BL, bx, by)} ` : `${rev(HE[r + 1][c], bx, by)} `
      d += c === 0 ? `L ${f(TL, bx, by)} ` : `${rev(VE[c][r], bx, by)} `
      d += 'Z'
      pieces.push({
        id: `${r}-${c}`,
        row: r,
        col: c,
        d,
        bbox: { x: bx, y: by, w: cw + 2 * pad, h: ch + 2 * pad },
        home: { x: bx, y: by },
      })
    }
  }

  return { width, height, cols, rows, cw, ch, pad, pieces }
}
