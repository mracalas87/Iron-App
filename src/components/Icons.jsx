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
