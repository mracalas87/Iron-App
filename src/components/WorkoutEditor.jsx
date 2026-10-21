import { useEffect, useState } from 'react'
import ExercisePicker from './ExercisePicker'
import { bestSet, MUSCLE_GROUPS } from '../db'

export default function WorkoutEditor({ workout, setWorkout }) {
  const [addingExercise, setAddingExercise] = useState(false)
  const [bestSets, setBestSets] = useState({}) // exerciseId -> { reps, weight } | null

  const exerciseIdsKey = workout.exercises.map((ex) => ex.exerciseId).join(',')

  useEffect(() => {
    let cancelled = false
    const ids = [...new Set(workout.exercises.map((ex) => ex.exerciseId))]
    Promise.all(ids.map(async (id) => [id, await bestSet(id)])).then((pairs) => {
      if (cancelled) return
      setBestSets(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseIdsKey])

  function updateTitle(title) {
    setWorkout((w) => ({ ...w, title }))
  }

  function updateDate(date) {
    setWorkout((w) => ({ ...w, date }))
  }

  function toggleMuscleGroup(group) {
    setWorkout((w) => {
      const current = w.muscleGroups || []
      const next = current.includes(group)
        ? current.filter((g) => g !== group)
        : [...current, group]
      return { ...w, muscleGroups: next }
    })
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

  // Swap an exercise with its neighbour (dir -1 = up, +1 = down). The order is saved with the workout.
  function moveExercise(exIdx, dir) {
    setWorkout((w) => {
      const to = exIdx + dir
      if (to < 0 || to >= w.exercises.length) return w
      const exercises = [...w.exercises]
      ;[exercises[exIdx], exercises[to]] = [exercises[to], exercises[exIdx]]
      return { ...w, exercises }
    })
  }

  return (
    <div>
      <div className="card">
        <div className="field">
          <label>Title</label>
          <input type="text" value={workout.title} onChange={(e) => updateTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={workout.date} onChange={(e) => updateDate(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Muscle groups</label>
          <div className="chip-row">
            {MUSCLE_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                className={`chip${(workout.muscleGroups || []).includes(g) ? ' active' : ''}`}
                onClick={() => toggleMuscleGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {workout.exercises.map((ex, exIdx) => {
        const best = bestSets[ex.exerciseId]
        return (
        <div className="card" key={exIdx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, flex: 1, minWidth: 0 }}>{ex.exerciseName}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 'none' }}>
              {workout.exercises.length > 1 && (
                <>
                  <button
                    type="button"
                    className="move-btn"
                    aria-label={`Move ${ex.exerciseName} up`}
                    disabled={exIdx === 0}
                    onClick={() => moveExercise(exIdx, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="move-btn"
                    aria-label={`Move ${ex.exerciseName} down`}
                    disabled={exIdx === workout.exercises.length - 1}
                    onClick={() => moveExercise(exIdx, 1)}
                  >
                    ↓
                  </button>
                </>
              )}
              <button className="btn-ghost" style={{ color: 'var(--danger)', marginLeft: 6 }} onClick={() => removeExercise(exIdx)}>
                remove
              </button>
            </div>
          </div>
          {best && (
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 10 }}>
              Best: <span style={{ color: 'var(--pr)', fontFamily: 'var(--mono)' }}>{best.reps} × {best.weight}kg</span>
            </div>
          )}
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
        )
      })}

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
