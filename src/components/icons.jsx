export function FireIcon() {
  return (
    <svg className="fire-icon" viewBox="0 0 24 24" fill="#FFABE7">
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
      stroke="#F7F4D5"
      strokeWidth="1.4"
    >
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M3 7l2-3h14l2 3" />
      <path d="M10 12h4" />
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
