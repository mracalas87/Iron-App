import { useEffect, useState } from 'react'
import { listExercises, exerciseHistory, updateExerciseCategory, CATEGORIES } from '../db'

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ExercisesByCategory() {
  const [exercises, setExercises] = useState([])
  const [category, setCategory] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    refreshExercises()
  }, [])

  async function refreshExercises() {
    setExercises(await listExercises())
  }

  useEffect(() => {
    if (!selectedExercise) return
    exerciseHistory(selectedExercise.id).then((entries) =>
      setHistory(entries.slice().sort((a, b) => new Date(b.date) - new Date(a.date)))
    )
  }, [selectedExercise])

  async function changeCategory(exercise, newCategory) {
    await updateExerciseCategory(exercise.id, newCategory)
    await refreshExercises()
  }

  // ---- Exercise history detail ----
  if (selectedExercise) {
    return (
      <div>
        <button
          className="btn-ghost"
          onClick={() => {
            setSelectedExercise(null)
            setHistory([])
          }}
        >
          ← {category}
        </button>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 12px' }}>
          {selectedExercise.name}
        </h2>
        {history.length === 0 ? (
          <div className="empty-state">
            <p>No history yet for this exercise.</p>
          </div>
        ) : (
          history.map((entry, i) => (
            <div className="card" key={i}>
              <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginBottom: 8 }}>
                {formatDate(entry.date)} · {entry.workoutTitle}
              </div>
              {entry.sets.map((s, j) => (
                <div
                  key={j}
                  style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--chalk-dim)', padding: '2px 0' }}
                >
                  {s.reps} reps × {s.weight}kg
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    )
  }

  // ---- Exercises within a category ----
  if (category) {
    const list = exercises.filter((e) => e.category === category)
    return (
      <div>
        <button className="btn-ghost" onClick={() => setCategory(null)}>
          ← Body parts
        </button>
        <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 12px' }}>{category}</h2>
        {list.length === 0 ? (
          <div className="empty-state">
            <p>No exercises tagged {category} yet.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 4 }}>
            {list.map((e) => (
              <div
                key={e.id}
                className="exercise-list-item"
                style={{ cursor: 'default' }}
              >
                <button
                  onClick={() => setSelectedExercise(e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--chalk)',
                    textAlign: 'left',
                    flex: 1,
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0
                  }}
                >
                  {e.name}
                </button>
                <select
                  value={e.category}
                  onChange={(ev) => changeCategory(e, ev.target.value)}
                  style={{
                    fontSize: 12,
                    background: 'var(--surface-raised)',
                    color: 'var(--chalk-dim)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '4px 6px'
                  }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ---- Body part sections ----
  return (
    <div className="card" style={{ padding: 4 }}>
      {CATEGORIES.map((c) => {
        const count = exercises.filter((e) => e.category === c).length
        return (
          <button key={c} className="exercise-list-item" onClick={() => setCategory(c)}>
            <span>{c}</span>
            <span className="category">
              {count} exercise{count !== 1 ? 's' : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
