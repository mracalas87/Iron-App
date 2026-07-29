import { useState } from 'react'
import ExercisePicker from './ExercisePicker'

export default function WorkoutEditor({ workout, setWorkout }) {
  const [addingExercise, setAddingExercise] = useState(false)

  function updateTitle(title) {
    setWorkout((w) => ({ ...w, title }))
  }

  function updateDate(date) {
    setWorkout((w) => ({ ...w, date }))
  }

  function addExercise(exercise) {
    setWorkout((w) => ({
      ...w,
      exercises: [
        ...w.exercises,
        { exerciseId: exercise.id, exerciseName: exercise.name, sets: [{ reps: '', weight: '' }] }
      ]
    }))
    setAddingExercise(false)
  }

  function updateSet(exIdx, setIdx, field, value) {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, [field]: value } : s)) }
      )
    }))
  }

  function addSetRow(exIdx) {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, i) => {
        if (i !== exIdx) return ex
        const last = ex.sets[ex.sets.length - 1]
        return { ...ex, sets: [...ex.sets, { reps: last?.reps ?? '', weight: last?.weight ?? '' }] }
      })
    }))
  }

  function removeSetRow(exIdx, setIdx) {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex, i) =>
        i !== exIdx ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
      )
    }))
  }

  function removeExercise(exIdx) {
    setWorkout((w) => ({ ...w, exercises: w.exercises.filter((_, i) => i !== exIdx) }))
  }

  return (
    <div>
      <div className="card">
        <div className="field">
          <label>Title</label>
          <input type="text" value={workout.title} onChange={(e) => updateTitle(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Date</label>
          <input type="date" value={workout.date} onChange={(e) => updateDate(e.target.value)} />
        </div>
      </div>

      {workout.exercises.map((ex, exIdx) => (
        <div className="card" key={exIdx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600 }}>{ex.exerciseName}</span>
            <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeExercise(exIdx)}>
              remove
            </button>
          </div>
          {ex.sets.map((s, setIdx) => (
            <div className="set-row" key={setIdx}>
              <div className="set-index">{setIdx + 1}</div>
              <input
                type="number"
                inputMode="numeric"
                placeholder="reps"
                value={s.reps}
                onChange={(e) => updateSet(exIdx, setIdx, 'reps', e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="kg"
                value={s.weight}
                onChange={(e) => updateSet(exIdx, setIdx, 'weight', e.target.value)}
              />
              <button
                className="remove-set"
                onClick={() => removeSetRow(exIdx, setIdx)}
                disabled={ex.sets.length === 1}
                style={{ opacity: ex.sets.length === 1 ? 0.3 : 1 }}
              >
                ×
              </button>
            </div>
          ))}
          <button className="btn-ghost" onClick={() => addSetRow(exIdx)}>
            + Add set
          </button>
        </div>
      ))}

      <div className="card">
        {addingExercise ? (
          <ExercisePicker selected={null} onSelect={addExercise} onClear={() => setAddingExercise(false)} />
        ) : (
          <button className="btn btn-secondary" onClick={() => setAddingExercise(true)}>
            + Choose exercise
          </button>
        )}
      </div>
    </div>
  )
}

export function isSetValid(s) {
  return s.reps !== '' && s.weight !== '' && Number(s.reps) > 0 && Number(s.weight) >= 0
}

export function cleanWorkout(workout) {
  return {
    ...workout,
    exercises: workout.exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        sets: ex.sets
          .filter(isSetValid)
          .map((s) => ({ reps: Number(s.reps), weight: Number(s.weight) }))
      }))
      .filter((ex) => ex.sets.length > 0)
  }
}

export function canSaveWorkout(workout) {
  return !!workout && workout.exercises.some((ex) => ex.sets.some(isSetValid))
}
