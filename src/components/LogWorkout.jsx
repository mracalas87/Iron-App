import { useState } from 'react'
import WorkoutEditor, { canSaveWorkout, cleanWorkout } from './WorkoutEditor'
import { saveWorkout } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function LogWorkout({ activeWorkout, setActiveWorkout, onSaved }) {
  const [draftTitle, setDraftTitle] = useState('')
  const [saved, setSaved] = useState(false)

  function startWorkout() {
    setActiveWorkout({ title: draftTitle.trim() || 'Workout', date: todayISO(), exercises: [] })
    setDraftTitle('')
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
        <div className="card">
          <div className="field">
            <label>Workout title</label>
            <input
              type="text"
              placeholder="e.g. Push Day"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={startWorkout}>
            Record workout
          </button>
        </div>
        {saved && (
          <p style={{ color: 'var(--pr)', fontSize: 13, textAlign: 'center' }}>
            Workout saved.
          </p>
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
