export function FireIcon({ color = '#FFABE7' }) {
  return (
    <svg className="fire-icon" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1.5 1 2 3 2 4.5A6.5 6.5 0 0 1 5 13.5C5 9 8 6 9 4c.3 2 1 2.5 1.5 2.5C11 5 11 3 12 2z" />
    </svg>
  )
}

export function ArchiveIcon() {
  return (
    <svg
      className="archive-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M3 7l2-3h14l2 3" />
      <path d="M10 12h4" />
    </svg>
  )
}

// standing / vanity mirror — rounded glass on a stand, with a shine
export function MirrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="1.8" width="16" height="16" rx="8" />
      <path d="M8 5.8c-1.1 1.1-1.8 2.6-1.9 4.3" opacity="0.5" />
      <path d="M12 17.8v3.4" />
      <path d="M7.5 21.2h9" />
    </svg>
  )
}

// settings cog — toothed gear ring + centre (fills the box for even sizing)
export function CogIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 12 L17.54 14.3 L17.66 17.66 L14.3 17.54 L12 20 L9.7 17.54 L6.34 17.66 L6.46 14.3 L4 12 L6.46 9.7 L6.34 6.34 L9.7 6.46 L12 4 L14.3 6.46 L17.66 6.34 L17.54 9.7 Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  )
}

export function BackIcon() {
  return (
    <svg
      className="back-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F7F4D5"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function SendStar() {
  return (
    <svg className="send-star" viewBox="0 0 20 20">
      <path
        d="M10 1 L10 19 M1 10 L19 10 M3.5 3.5 L16.5 16.5 M16.5 3.5 L3.5 16.5"
        stroke="#FFABE7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

// four-point sparkle, symmetric around the centre so it sits inline cleanly
export function SparkleMini({ size = 14, color = '#FFABE7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 3C12.5 8 16 11.5 21 12C16 12.5 12.5 16 12 21C11.5 16 8 12.5 3 12C8 11.5 11.5 8 12 3Z" />
    </svg>
  )
}

// six-point asterisk, perfectly centred in its box so hover-rotation spins in place
export function CornerSparkle() {
  return (
    <svg className="corner-sparkle" viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="#FFABE7" strokeWidth="2.4" strokeLinecap="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="4.2" y1="7.5" x2="19.8" y2="16.5" />
        <line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
      </g>
    </svg>
  )
}

// placeholder message-in-a-bottle — swap for the user's PNG later
export function BottleIcon() {
  return (
    <svg className="bottle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2h4v3l1.2 2.2a3 3 0 0 1 .3 1.3V20a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V8.5a3 3 0 0 1 .3-1.3L10 5z" />
      <path d="M9.2 12.5h5.6" />
      <path d="M11 2.5h2" />
    </svg>
  )
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M9 6 L18 12 L9 18 Z" />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

export function MicIcon() {
  return (
    <svg className="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  )
}

export function AlignIcon({ align = 'center' }) {
  const short =
    align === 'left'
      ? { x1: 4, x2: 14 }
      : align === 'right'
        ? { x1: 10, x2: 20 }
        : { x1: 6, x2: 18 }
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1={short.x1} y1="12" x2={short.x2} y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

// text-beside-image: a filled box with text lines flowing next to / under it
export function WrapIcon({ on = false }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4.5" width="8" height="8" rx="1.4" fill={on ? 'currentColor' : 'none'} />
      <line x1="13.5" y1="6" x2="21" y2="6" />
      <line x1="13.5" y1="10.5" x2="21" y2="10.5" />
      <line x1="3" y1="16.5" x2="21" y2="16.5" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4h6l-1 6 3 3H7l3-3-1-6z" />
      <path d="M12 16v4" />
    </svg>
  )
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.2-3.2" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
    </svg>
  )
}

export function DotStar({ size = 18, color = '#6B8C76' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
      <circle cx="50" cy="44" r="1.3" />
      <circle cx="50" cy="38" r="1.3" />
      <circle cx="50" cy="32" r="1.3" />
      <circle cx="50" cy="24" r="1.3" />
      <circle cx="50" cy="18" r="1.3" />
      <circle cx="50" cy="9" r="1.3" />
      <circle cx="56" cy="62" r="1.3" />
      <circle cx="62" cy="68" r="1.3" />
      <circle cx="68" cy="74" r="1.3" />
      <circle cx="76" cy="76" r="1.3" />
      <circle cx="82" cy="82" r="1.3" />
      <circle cx="91" cy="91" r="1.3" />
      <circle cx="38" cy="62" r="1.3" />
      <circle cx="32" cy="68" r="1.3" />
      <circle cx="26" cy="74" r="1.3" />
      <circle cx="18" cy="76" r="1.3" />
      <circle cx="12" cy="82" r="1.3" />
      <circle cx="3" cy="91" r="1.3" />
      <circle cx="50" cy="50" r="1.8" />
    </svg>
  )
}
