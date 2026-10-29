// Small sport icons for the Home screen: lifting, running, swimming and cycling.
const COLOURS = { Lift: '#ff8a3d', Run: '#6b8cff', Race: '#6b8cff', Swim: '#34d3be', Ride: '#a98bff', Rest: '#9bb0c9' }

const SHAPES = {
  Lift: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </>
  ),
  Run: (
    <>
      <circle cx="16" cy="4.5" r="1.6" />
      <path d="M14 8.5 11 14l4 1.5-.5 4.5M11 14l-3.5 3-2.5-.5M14 8.5l3.5 2 2.5-1M14 8.5l-3.5 1-2 2.5" />
    </>
  ),
  Rest: (
    <>
      <path d="M3 16h4l-4 5h4M9.5 9.5h5l-5 6.5h5M16 3h5.5l-5.5 7.5h5.5" />
    </>
  ),
  Swim: (
    <>
      <circle cx="17" cy="6.5" r="1.6" />
      <path d="M5 13l5.5-4 4.5 2M2 17c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M2 21c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
    </>
  ),
  Ride: (
    <>
      <circle cx="18.5" cy="17.5" r="3.5" />
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="15" cy="5" r="1" />
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </>
  )
}

// kind: 'Lift' | 'Run' | 'Race' | 'Swim' | 'Ride' | 'Rest' (the ZZZ for an off day)
export default function SportIcon({ kind, size = 18 }) {
  const shape = SHAPES[kind === 'Race' ? 'Run' : kind]
  if (!shape) return <span>{kind}</span>
  return (
    <svg
      className="sport-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={COLOURS[kind]}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={kind}
    >
      <title>{kind}</title>
      {shape}
    </svg>
  )
}

// Icons for the drop-down panels on Home and Plan: a line icon on a tinted rounded tile.
const PANEL_ICONS = {
  today: { color: '#3fd07a', shape: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" /> },
  coming: {
    color: '#6b8cff',
    shape: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    )
  },
  stats: { color: '#a98bff', shape: <path d="M5 20V11M12 20V4M19 20v-6" /> },
  month: {
    color: '#34d3be',
    shape: (
      <>
        <path d="M3 17l5-6 4 3 8-9" />
        <path d="M3 21h18" />
      </>
    )
  },
  recent: {
    color: '#ff8a3d',
    shape: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    )
  },
  details: { color: '#9bb0c9', shape: <path d="M4 6h16M4 12h16M4 18h10" /> },
  now: {
    color: '#6b8cff',
    shape: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" />
      </>
    )
  },
  week: {
    color: '#3fd07a',
    shape: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
      </>
    )
  },
  race: { color: '#ff6b61', shape: <path d="M5 21V4M5 4h11l-2 4 2 4H5" /> },
  pace: {
    color: '#a98bff',
    shape: (
      <>
        <path d="M4 16a8 8 0 1116 0" />
        <path d="M12 16l4-5" />
      </>
    )
  },
  swimride: {
    color: '#34d3be',
    shape: <path d="M2 10c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M2 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
  },
  goal: {
    color: '#ff8a3d',
    shape: (
      <>
        <path d="M6 4h12v4a6 6 0 01-12 0z" />
        <path d="M6 6H3v1a3 3 0 003 3M18 6h3v1a3 3 0 01-3 3M12 14v4M8 20h8" />
      </>
    )
  },
  coach: {
    color: '#34d3be',
    shape: (
      <>
        <path d="M21 12a8 8 0 01-11.4 7.2L4 20l1-4.6A8 8 0 1121 12z" />
        <path d="M9 12h.01M12 12h.01M15 12h.01" />
      </>
    )
  },
  lifting: { color: '#ff8a3d', shape: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /> },
  rules: { color: '#9bb0c9', shape: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /> }
}

export function PanelIcon({ name, size = 20 }) {
  const def = PANEL_ICONS[name]
  if (!def) return null
  return (
    <span className="panel-ico" style={{ background: `${def.color}1f`, color: def.color }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {def.shape}
      </svg>
    </span>
  )
}

// Small muscle group logos for the Log page: a mini body with the working muscle filled in.
// Shoulders, chest and abs are the front view; back and hamstrings are the rear view (hamstrings
// include the glutes); biceps and triceps are single arm pictograms.
const BODY = (
  <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.3" fill="none">
    <circle cx="12" cy="3.6" r="2" />
    <rect x="8" y="7" width="8" height="10" rx="1.8" />
    <rect x="3.6" y="7.4" width="3" height="8.4" rx="1.5" />
    <rect x="17.4" y="7.4" width="3" height="8.4" rx="1.5" />
    <rect x="8" y="17.6" width="3.4" height="5.6" rx="1.5" />
    <rect x="12.6" y="17.6" width="3.4" height="5.6" rx="1.5" />
  </g>
)

const MUSCLE_SHAPES = {
  Shoulders: (
    <>
      {BODY}
      <circle cx="6" cy="8.9" r="2.4" fill="currentColor" />
      <circle cx="18" cy="8.9" r="2.4" fill="currentColor" />
    </>
  ),
  Chest: (
    <>
      {BODY}
      <rect x="8" y="7.3" width="8" height="4.6" rx="1.8" fill="currentColor" />
    </>
  ),
  Abs: (
    <>
      {BODY}
      <rect x="9.3" y="12.3" width="5.4" height="4.7" rx="1.3" fill="currentColor" />
    </>
  ),
  Back: (
    <>
      {BODY}
      <path d="M8 7.3h8l-1.4 6.2-2.6 3-2.6-3z" fill="currentColor" />
    </>
  ),
  Quads: (
    <>
      {BODY}
      <rect x="8" y="17.6" width="3.4" height="5.6" rx="1.5" fill="currentColor" />
      <rect x="12.6" y="17.6" width="3.4" height="5.6" rx="1.5" fill="currentColor" />
    </>
  ),
  Hamstrings: (
    <>
      {BODY}
      <path d="M7.6 17.4c1.2-2 3-2 4.4 0 1.4-2 3.2-2 4.4 0z" fill="currentColor" />
      <rect x="8" y="18.2" width="3.4" height="5" rx="1.5" fill="currentColor" />
      <rect x="12.6" y="18.2" width="3.4" height="5" rx="1.5" fill="currentColor" />
    </>
  ),
  Biceps: (
    <>
      <path d="M4 19c0-5.5 3-9.5 8.5-9.5l3 1 2.5-5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.6" cy="13" r="3" fill="currentColor" />
    </>
  ),
  Triceps: (
    <>
      <rect x="8.5" y="2.5" width="7" height="14" rx="3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeOpacity="0.5" />
      <rect x="8.5" y="8.5" width="7" height="8" rx="3.5" fill="currentColor" />
      <path d="M12 18.5v3m-2-2l2 2 2-2" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

export function MuscleIcon({ name, size = 24 }) {
  const shape = MUSCLE_SHAPES[name]
  if (!shape) return <span>{name.slice(0, 2).toUpperCase()}</span>
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {shape}
    </svg>
  )
}
