// Small sport icons for the Home screen: lifting, running, swimming and cycling.
const COLOURS = { Lift: '#f07a2d', Run: '#3d6bff', Race: '#3d6bff', Swim: '#1fb5a3', Ride: '#8a5cf5', Rest: '#6f7f99' }

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
  today: { color: '#1f9d55', shape: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" /> },
  coming: {
    color: '#3d6bff',
    shape: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    )
  },
  stats: { color: '#8a5cf5', shape: <path d="M5 20V11M12 20V4M19 20v-6" /> },
  month: {
    color: '#1fb5a3',
    shape: (
      <>
        <path d="M3 17l5-6 4 3 8-9" />
        <path d="M3 21h18" />
      </>
    )
  },
  recent: {
    color: '#f07a2d',
    shape: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    )
  },
  details: { color: '#5a6a85', shape: <path d="M4 6h16M4 12h16M4 18h10" /> },
  now: {
    color: '#3d6bff',
    shape: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" />
      </>
    )
  },
  week: {
    color: '#1f9d55',
    shape: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
      </>
    )
  },
  race: { color: '#d93a2f', shape: <path d="M5 21V4M5 4h11l-2 4 2 4H5" /> },
  pace: {
    color: '#8a5cf5',
    shape: (
      <>
        <path d="M4 16a8 8 0 1116 0" />
        <path d="M12 16l4-5" />
      </>
    )
  },
  swimride: {
    color: '#1fb5a3',
    shape: <path d="M2 10c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1M2 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
  },
  lifting: { color: '#f07a2d', shape: <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /> },
  rules: { color: '#5a6a85', shape: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /> }
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
