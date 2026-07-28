import { useEffect, useRef, useState } from 'react'
import { PlayIcon, PauseIcon } from './icons'

// Ambient tracks generated with the Web Audio API (no audio files needed).
// Lives above <Routes/>, so navigation never interrupts playback.
const TRACKS = [
  { id: 'rain', name: 'rain' },
  { id: 'pink', name: 'pink noise' },
  { id: 'storm', name: 'rain & thunder' },
  { id: 'piano', name: 'soft piano' },
]

function noiseSource(ctx, fill) {
  const frames = ctx.sampleRate * 3
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  fill(buffer.getChannelData(0), frames)
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// --- track builders: each returns a stop() that tears the track down ---
function buildRain(ctx, dest) {
  let last = 0
  const src = noiseSource(ctx, (d, n) => {
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.2
    }
  })
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 320
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1900
  src.connect(hp)
  hp.connect(lp)
  lp.connect(dest)
  src.start()
  return () => {
    try {
      src.stop()
    } catch {
      /* noop */
    }
  }
}

function buildPink(ctx, dest) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  const src = noiseSource(ctx, (d, n) => {
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.4
      b6 = w * 0.115926
    }
  })
  src.connect(dest)
  src.start()
  return () => {
    try {
      src.stop()
    } catch {
      /* noop */
    }
  }
}

function buildStorm(ctx, dest) {
  const stopRain = buildRain(ctx, dest)
  let timer
  const thunder = () => {
    const src = noiseSource(ctx, (d, n) => {
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
    })
    src.loop = false
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 380
    lp.Q.value = 0.8
    const g = ctx.createGain()
    const t = ctx.currentTime
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.9, t + 0.15)
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
    src.connect(lp)
    lp.connect(g)
    g.connect(dest)
    src.start()
    src.stop(t + 3)
    timer = setTimeout(thunder, 7000 + Math.random() * 12000)
  }
  timer = setTimeout(thunder, 3000 + Math.random() * 4000)
  return () => {
    stopRain()
    clearTimeout(timer)
  }
}

function buildPiano(ctx, dest) {
  // gentle generative pentatonic notes
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]
  const wash = ctx.createGain()
  wash.gain.value = 0.9
  wash.connect(dest)
  let timer
  const note = () => {
    const freq = scale[Math.floor(Math.random() * scale.length)]
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = ctx.createGain()
    const t = ctx.currentTime
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.22, t + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.4)
    osc.connect(g)
    g.connect(wash)
    osc.start(t)
    osc.stop(t + 2.6)
    timer = setTimeout(note, 900 + Math.random() * 1900)
  }
  timer = setTimeout(note, 300)
  return () => clearTimeout(timer)
}

const BUILDERS = { rain: buildRain, pink: buildPink, storm: buildStorm, piano: buildPiano }

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [trackId, setTrackId] = useState('rain')
  const [volume, setVolume] = useState(0.5)

  const ctxRef = useRef(null)
  const gainRef = useRef(null)
  const stopRef = useRef(null)

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

  const startTrack = async (id) => {
    ensureContext()
    await ctxRef.current.resume()
    stopRef.current?.()
    stopRef.current = BUILDERS[id](ctxRef.current, gainRef.current)
  }

  const togglePlay = async () => {
    if (playing) {
      stopRef.current?.()
      stopRef.current = null
      setPlaying(false)
    } else {
      await startTrack(trackId)
      setPlaying(true)
    }
  }

  const selectTrack = async (id) => {
    setTrackId(id)
    if (playing) await startTrack(id)
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume
  }, [volume])

  return (
    <div className="music-player">
      <button
        className="music-toggle"
        onClick={togglePlay}
        aria-label={playing ? 'pause' : 'play ambient sound'}
        title="ambient sound"
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className="music-panel">
        <div className="track-list">
          {TRACKS.map((t) => (
            <button
              key={t.id}
              className={`track-item${t.id === trackId ? ' active' : ''}`}
              onClick={() => selectTrack(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
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
      </div>
    </div>
  )
}
