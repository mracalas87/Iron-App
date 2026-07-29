import { useEffect, useState } from 'react'
import { findExercises, addExercise, CATEGORIES } from '../db'

export default function ExercisePicker({ selected, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showNewForm, setShowNewForm] = useState(false)
  const [newCategory, setNewCategory] = useState('Other')

  useEffect(() => {
    let active = true
    findExercises(query).then((r) => {
      if (active) setResults(r)
    })
    return () => {
      active = false
    }
  }, [query])

  if (selected) {
    return (
      <div className="field">
        <label>Exercise</label>
        <div className="selected-exercise">
          <span>{selected.name}</span>
          <button onClick={onClear}>Change</button>
        </div>
      </div>
    )
  }

  const exactMatch = results.some(
    (r) => r.name.toLowerCase() === query.trim().toLowerCase()
  )

  async function handleAddNew() {
    const ex = await addExercise(query, newCategory)
    onSelect(ex)
    setQuery('')
    setShowNewForm(false)
  }

  return (
    <div className="field">
      <label>Exercise</label>
      <input
        type="text"
        placeholder="Search or add an exercise"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowNewForm(false)
        }}
      />
      {query.trim() && (
        <div className="exercise-search-results">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                onSelect(r)
                setQuery('')
              }}
            >
              {r.name} <span style={{ color: 'var(--chalk-dim)' }}>· {r.category}</span>
            </button>
          ))}
          {!exactMatch && !showNewForm && (
            <button className="add-new" onClick={() => setShowNewForm(true)}>
              + Add "{query.trim()}" as new exercise
            </button>
          )}
        </div>
      )}
      {showNewForm && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="field">
            <label>Category</label>
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleAddNew}>
            Add exercise
          </button>
        </div>
      )}
    </div>
  )
}
