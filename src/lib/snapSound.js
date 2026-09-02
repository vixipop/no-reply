// Snap sound effects for the puzzle. Drop any number of short .mp3 clips into
// src/assets/puzzle/snaps/ and they're picked up automatically; a random one
// plays each time pieces correctly connect. No clips → silent (no error).
const modules = import.meta.glob('../assets/puzzle/snaps/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})
const CLIPS = Object.values(modules)

let last = -1

export function hasSnapSounds() {
  return CLIPS.length > 0
}

export function playSnap(volume = 0.7) {
  if (!CLIPS.length) return
  // avoid repeating the same clip twice in a row when we have options
  let i = Math.floor(Math.random() * CLIPS.length)
  if (CLIPS.length > 1 && i === last) i = (i + 1) % CLIPS.length
  last = i
  const a = new Audio(CLIPS[i])
  a.volume = volume
  a.play().catch(() => {})
}
