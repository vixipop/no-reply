import { useEffect, useRef, useState } from 'react'
import { PlayIcon, PauseIcon } from './icons'

// Ambient rain, generated with the Web Audio API (no audio file needed).
// Lives at the app level (outside <Routes/>), so navigation never interrupts it.
export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)

  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const srcRef = useRef(null)

  const ensureContext = () => {
    if (ctxRef.current) return
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)
    ctxRef.current = ctx
    gainRef.current = gain
  }

  const buildRain = (ctx) => {
    // ~3s of brown-ish noise, looped and softened into a rain-like wash
    const frames = ctx.sampleRate * 3
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < frames; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 320
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1900
    src.connect(hp)
    hp.connect(lp)
    lp.connect(gainRef.current)
    return src
  }

  const toggle = async () => {
    ensureContext()
    const ctx = ctxRef.current
    if (!playing) {
      await ctx.resume()
      const src = buildRain(ctx)
      src.start()
      srcRef.current = src
      setPlaying(true)
    } else {
      try {
        srcRef.current?.stop()
      } catch {
        /* already stopped */
      }
      srcRef.current = null
      setPlaying(false)
    }
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume
  }, [volume])

  return (
    <div className={`music-player${playing ? ' playing' : ''}`}>
      <button
        className="music-toggle"
        onClick={toggle}
        aria-label={playing ? 'pause ambient rain' : 'play ambient rain'}
        title="ambient rain"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      {playing && (
        <input
          className="music-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          aria-label="volume"
        />
      )}
    </div>
  )
}
