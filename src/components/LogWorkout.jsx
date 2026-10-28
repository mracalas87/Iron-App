import { useEffect, useState } from 'react'
import WorkoutEditor, { canSaveWorkout, cleanWorkout } from './WorkoutEditor'
import { MuscleIcon } from './Icons'
import MuscleHeatmap from './MuscleHeatmap'
import { saveWorkout, listWorkouts, MUSCLE_GROUPS } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// A colour for each muscle group tile.
const GROUP_STYLE = {
  Shoulders: { colour: '#ff8a3d' },
  Chest: { colour: '#ff6b61' },
  Back: { colour: '#6b8cff' },
  Quads: { colour: '#3fd07a' },
  Hamstrings: { colour: '#34d3be' },
  Biceps: { colour: '#a98bff' },
  Triceps: { colour: '#e8639e' },
  Abs: { colour: '#9bb0c9' }
}

const daysSince = (iso) => Math.round((new Date(todayISO() + 'T12:00:00Z') - new Date(iso + 'T12:00:00Z')) / 86400000)
const lastTrained = (iso) => {
  if (!iso) return 'Not logged yet'
  const n = daysSince(iso)
  return n <= 0 ? 'Trained today' : n === 1 ? 'Last trained yesterday' : `Last trained ${n} days ago`
}

export default function LogWorkout({ activeWorkout, setActiveWorkout, onSaved }) {
  const [draftMuscleGroups, setDraftMuscleGroups] = useState([])
  const [saved, setSaved] = useState(false)
  const [lastDone, setLastDone] = useState({}) // group -> most recent date it was chosen

  // When each muscle group was last trained, from the logged workouts.
  useEffect(() => {
    let live = true
    listWorkouts().then((all) => {
      if (!live) return
      const map = {}
      for (const w of all) for (const g of w.muscleGroups || []) if (!map[g] || w.date > map[g]) map[g] = w.date
      setLastDone(map)
    })
    return () => {
      live = false
    }
  }, [saved, activeWorkout])

  function toggleDraftGroup(group) {
    setDraftMuscleGroups((groups) =>
      groups.includes(group) ? groups.filter((g) => g !== group) : [...groups, group]
    )
  }

  function startWorkout() {
    setActiveWorkout({
      title: draftMuscleGroups.length > 0 ? draftMuscleGroups.join(', ') : 'Workout',
      date: todayISO(),
      muscleGroups: draftMuscleGroups,
      exercises: []
    })
    setDraftMuscleGroups([])
  }

  async function handleEnd() {
    await saveWorkout({
      ...cleanWorkout(activeWorkout),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    })
    setActiveWorkout(null)
    setSaved(true)
    if (onSaved) onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  if (!activeWorkout) {
    const picked = draftMuscleGroups
    const startLabel =
      picked.length === 0 ? 'Start workout' : `Start ${picked.length > 2 ? `${picked[0]} +${picked.length - 1}` : picked.join(' + ')}`

    return (
      <div className="log-page">
        <div className="log-head">
          <div className="log-title">What are you training?</div>
          <div className="log-hint">
            Tap the main muscle first, then any extras.
          </div>
        </div>

        <div className="mg-list">
          {MUSCLE_GROUPS.map((g) => {
            const order = picked.indexOf(g)
            const on = order >= 0
            const style = GROUP_STYLE[g] || { colour: '#9bb0c9' }
            return (
              <button
                key={g}
                type="button"
                className={`mg-btn${on ? ' on' : ''}`}
                style={{ '--mg': style.colour }}
                onClick={() => toggleDraftGroup(g)}
                aria-pressed={on}
              >
                <span className="mg-ico"><MuscleIcon name={g} size={26} /></span>
                <span className="mg-text">
                  <span className="mg-name">{g}</span>
                  <span className="mg-sub">{lastTrained(lastDone[g])}</span>
                </span>
                <span className="mg-badge">{on ? (order === 0 ? 'Main' : order + 1) : ''}</span>
              </button>
            )
          })}
        </div>

        <MuscleHeatmap refreshKey={saved} />

        {saved && <p className="log-saved">Workout saved.</p>}

        <button className="btn btn-primary log-start" onClick={startWorkout}>
          {startLabel}
        </button>
      </div>
    )
  }

  const canEnd = canSaveWorkout(activeWorkout)

  return (
    <div>
      <WorkoutEditor workout={activeWorkout} setWorkout={setActiveWorkout} />
      <button
        className="btn btn-primary"
        disabled={!canEnd}
        onClick={handleEnd}
        style={{ opacity: canEnd ? 1 : 0.4 }}
      >
        End workout &amp; save
      </button>
    </div>
  )
}
