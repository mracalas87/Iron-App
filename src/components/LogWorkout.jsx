import { useState } from 'react'
import WorkoutEditor, { canSaveWorkout, cleanWorkout } from './WorkoutEditor'
import RunLogger from './RunLogger'
import { saveWorkout, MUSCLE_GROUPS } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function LogWorkout({ activeWorkout, setActiveWorkout, onSaved }) {
  const [draftMuscleGroups, setDraftMuscleGroups] = useState([])
  const [saved, setSaved] = useState(false)
  const [logMode, setLogMode] = useState('strength') // 'strength' | 'run'

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
    return (
      <div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button
            className={`chip${logMode === 'strength' ? ' active' : ''}`}
            onClick={() => setLogMode('strength')}
          >
            Strength
          </button>
          <button className={`chip${logMode === 'run' ? ' active' : ''}`} onClick={() => setLogMode('run')}>
            Run
          </button>
        </div>

        {logMode === 'run' && <RunLogger />}

        {logMode === 'strength' && (
          <>
        <div className="card">
          <div className="field">
            <label>Muscle groups</label>
            <div className="chip-row">
              {MUSCLE_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip${draftMuscleGroups.includes(g) ? ' active' : ''}`}
                  onClick={() => toggleDraftGroup(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={startWorkout} style={{ marginTop: 14 }}>
            Record workout
          </button>
        </div>
        {saved && (
          <p style={{ color: 'var(--pr)', fontSize: 13, textAlign: 'center' }}>
            Workout saved.
          </p>
        )}

          </>
        )}

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
