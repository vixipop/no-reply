// Read an image file, downscale it to fit, and return a compressed data URL.
// Storing full-resolution photos as data URLs quickly blows past localStorage's
// ~5MB quota — which makes saves throw and the "saving…" indicator hang. Shrinking
// on attach keeps entries small enough to persist.
export function fileToDataURL(file, { maxDim = 1400, quality = 0.82 } = {}) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(null)
    reader.onload = () => {
      const original = reader.result
      const img = new Image()
      img.onerror = () => resolve(original)
      img.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        const scale = Math.min(1, maxDim / Math.max(w, h))
        // already small & modest in size → keep as-is (preserves PNG/transparency)
        if (scale === 1 && original.length < 500000) return resolve(original)
        const cw = Math.max(1, Math.round(w * scale))
        const ch = Math.max(1, Math.round(h * scale))
        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, cw, ch)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch {
          resolve(original)
        }
      }
      img.src = original
    }
    reader.readAsDataURL(file)
  })
}
