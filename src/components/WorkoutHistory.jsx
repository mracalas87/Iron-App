import { useEffect, useState } from 'react'
import { listWorkouts, deleteWorkout, updateWorkout, saveWorkout, workoutVolume } from '../db'
import WorkoutEditor, { canSaveWorkout, cleanWorkout } from './WorkoutEditor'
import ImportCSV from './ImportCSV'

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// Convert a saved workout (numeric sets) into editor-shape (string fields, editable)
function toDraft(workout) {
  return {
    title: workout.title,
    date: workout.date,
    exercises: workout.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({ reps: String(s.reps), weight: String(s.weight) }))
    }))
  }
}

export default function WorkoutHistory({ onRepeat }) {
  const [workouts, setWorkouts] = useState([])
  const [selected, setSelected] = useState(null)
  const [editDraft, setEditDraft] = useState(null) // non-null while editing
  const [editingId, setEditingId] = useState(null) // id being edited, null if editing a fresh copy
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const all = await listWorkouts()
    setWorkouts(all)
    if (selected) {
      const fresh = all.find((w) => w.id === selected.id)
      setSelected(fresh || null)
    }
  }

  async function handleDelete(id) {
    await deleteWorkout(id)
    setSelected(null)
    refresh()
  }

  function handleRepeat(workout) {
    const draft = {
      title: workout.title,
      date: todayISO(),
      exercises: workout.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: [{ reps: '', weight: '' }]
      }))
    }
    onRepeat(draft)
  }

  function startEdit(workout) {
    setEditingId(workout.id)
    setEditDraft(toDraft(workout))
  }

  function startCopy(workout) {
    setEditingId(null) // saving will create a new record, not overwrite
    setEditDraft({ ...toDraft(workout), date: todayISO() })
  }

  async function handleSaveEdit() {
    const cleaned = cleanWorkout(editDraft)
    if (editingId) {
      await updateWorkout(editingId, cleaned)
    } else {
      await saveWorkout({ ...cleaned, createdAt: new Date().toISOString(), completedAt: new Date().toISOString() })
    }
    setEditDraft(null)
    setEditingId(null)
    setSelected(null)
    refresh()
  }

  function cancelEdit() {
    setEditDraft(null)
    setEditingId(null)
  }

  // ---- Importing from CSV ----
  if (importing) {
    return (
      <ImportCSV
        onCancel={() => setImporting(false)}
        onDone={() => {
          setImporting(false)
          refresh()
        }}
      />
    )
  }

  // ---- Editing or copying a workout ----
  if (editDraft) {
    const canSave = canSaveWorkout(editDraft)
    return (
      <div>
        <button className="btn-ghost" onClick={cancelEdit}>
          ← Cancel
        </button>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 12px' }}>
          {editingId ? 'Edit workout' : 'Copy workout'}
        </h2>
        <WorkoutEditor workout={editDraft} setWorkout={setEditDraft} />
        <button
          className="btn btn-primary"
          disabled={!canSave}
          onClick={handleSaveEdit}
          style={{ opacity: canSave ? 1 : 0.4 }}
        >
          Save changes
        </button>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="empty-state">
        <div className="mark">—</div>
        <p>No workouts recorded yet. Start on the Log tab.</p>
        <button className="btn btn-secondary" onClick={() => setImporting(true)}>
          Import from Strong CSV
        </button>
      </div>
    )
  }

  // ---- Workout detail ----
  if (selected) {
    return (
      <div>
        <button className="btn-ghost" onClick={() => setSelected(null)}>
          ← All workouts
        </button>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 2px' }}>
          {selected.title}
        </h2>
        <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginBottom: 12 }}>
          {formatDate(selected.date)}
        </div>

        {selected.exercises.map((ex, idx) => (
          <div className="card" key={idx}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{ex.exerciseName}</div>
            {ex.sets.map((s, i) => (
              <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--chalk-dim)', padding: '2px 0' }}>
                {s.reps} reps × {s.weight}kg
              </div>
            ))}
          </div>
        ))}

        <button className="btn btn-primary" onClick={() => handleRepeat(selected)}>
          Repeat this workout
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <button className="btn btn-secondary" onClick={() => startEdit(selected)}>
            Edit
          </button>
          <button className="btn btn-secondary" onClick={() => startCopy(selected)}>
            Copy
          </button>
        </div>

        <button
          className="btn-ghost"
          style={{ color: 'var(--danger)', display: 'block', margin: '12px auto 0' }}
          onClick={() => handleDelete(selected.id)}
        >
          Delete workout
        </button>
      </div>
    )
  }

  // ---- Workout list ----
  return (
    <div>
      <button className="btn-ghost" onClick={() => setImporting(true)} style={{ marginBottom: 8 }}>
        + Import from Strong CSV
      </button>
      <div className="card" style={{ padding: 4 }}>
        {workouts.map((w) => (
          <button
            key={w.id}
            className="exercise-list-item"
            onClick={() => setSelected(w)}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ fontWeight: 600 }}>{w.title}</span>
              <span className="category">{formatDate(w.date)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)' }}>
              {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''} · {workoutVolume(w)}kg volume
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
