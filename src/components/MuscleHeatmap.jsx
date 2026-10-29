import { useEffect, useState } from 'react'
import { CHART } from '../theme'
import { listWorkouts, listExercises, MUSCLE_GROUPS } from '../db'
import { setsByGroup } from '../muscleSets'

// Heat map of the muscles trained in the last 7 days: a front and a back figure, each muscle
// coloured by how many sets it has had, with a note of what has not been trained yet.

const HEAT = [CHART.heatNone, '#ffd9a8', '#ffb04d', '#f2762e', '#d93a2f']
const level = (n) => (n <= 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 16 ? 3 : 4)

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

const OUTLINE = { fill: 'none', stroke: CHART.heatLine, strokeWidth: 0.9 }

function Figure({ ox, view, heat }) {
  const f = (g) => HEAT[heat[g] || 0]
  const legs = (colour) => (
    <>
      <rect x={ox + 8} y="17.6" width="3.4" height="5.8" rx="1.5" fill={colour} stroke={CHART.heatLine} strokeWidth="0.6" />
      <rect x={ox + 12.6} y="17.6" width="3.4" height="5.8" rx="1.5" fill={colour} stroke={CHART.heatLine} strokeWidth="0.6" />
    </>
  )
  return (
    <g>
      <circle cx={ox + 12} cy="3.6" r="2" {...OUTLINE} />
      <rect x={ox + 8} y="7" width="8" height="10" rx="1.8" {...OUTLINE} />
      {view === 'front' ? (
        <>
          <rect x={ox + 8} y="7.3" width="8" height="4.6" rx="1.8" fill={f('Chest')} />
          <rect x={ox + 9.3} y="12.3" width="5.4" height="4.7" rx="1.3" fill={f('Abs')} />
          <rect x={ox + 3.6} y="10.8" width="3" height="5" rx="1.5" fill={f('Biceps')} stroke={CHART.heatLine} strokeWidth="0.6" />
          <rect x={ox + 17.4} y="10.8" width="3" height="5" rx="1.5" fill={f('Biceps')} stroke={CHART.heatLine} strokeWidth="0.6" />
          {legs(f('Quads'))}
        </>
      ) : (
        <>
          <path d={`M${ox + 8} 7.3h8l-1.4 6.2-2.6 3-2.6-3z`} fill={f('Back')} />
          <rect x={ox + 3.6} y="10.8" width="3" height="5" rx="1.5" fill={f('Triceps')} stroke={CHART.heatLine} strokeWidth="0.6" />
          <rect x={ox + 17.4} y="10.8" width="3" height="5" rx="1.5" fill={f('Triceps')} stroke={CHART.heatLine} strokeWidth="0.6" />
          <path d={`M${ox + 7.6} 17.4c1.2-2 3-2 4.4 0 1.4-2 3.2-2 4.4 0z`} fill={f('Hamstrings')} />
          {legs(f('Hamstrings'))}
        </>
      )}
      <circle cx={ox + 6} cy="8.9" r="2.4" fill={f('Shoulders')} stroke={CHART.heatLine} strokeWidth="0.6" />
      <circle cx={ox + 18} cy="8.9" r="2.4" fill={f('Shoulders')} stroke={CHART.heatLine} strokeWidth="0.6" />
    </g>
  )
}

export default function MuscleHeatmap({ refreshKey }) {
  const [sets, setSets] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([listWorkouts(), listExercises()]).then(([workouts, exercises]) => {
      if (!live) return
      setSets(setsByGroup(workouts, new Map(exercises.map((e) => [e.id, e.category])), isoDaysAgo(6)))
    })
    return () => {
      live = false
    }
  }, [refreshKey])

  if (!sets) return null
  const heat = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, level(sets[g] || 0)]))
  const untrained = MUSCLE_GROUPS.filter((g) => !(sets[g] > 0))
  const top = MUSCLE_GROUPS.filter((g) => sets[g] > 0).sort((a, b) => sets[b] - sets[a])[0]

  return (
    <div className="heat-card">
      <svg className="heat-fig" viewBox="0 0 56 29" role="img" aria-label="Muscles trained in the last 7 days">
        <Figure ox={0} view="front" heat={heat} />
        <Figure ox={30} view="back" heat={heat} />
        <g fontSize="2.8" fontWeight="700" fill={CHART.axis} textAnchor="middle">
          <text x="12" y="27.6">FRONT</text>
          <text x="42" y="27.6">BACK</text>
        </g>
      </svg>
      <div className="heat-text">
        <div className="heat-title">Last 7 days</div>
        <div className="heat-legend">
          <span>Less</span>
          {HEAT.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
          <span>More</span>
        </div>
        {top ? <div className="heat-line">Most: {top} ({Math.round(sets[top])} sets)</div> : <div className="heat-line">Nothing trained yet</div>}
        {untrained.length > 0 && untrained.length < MUSCLE_GROUPS.length && (
          <div className="heat-line">Not yet: {untrained.join(', ')}</div>
        )}
      </div>
    </div>
  )
}
