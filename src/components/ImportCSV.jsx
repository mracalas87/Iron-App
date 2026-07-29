import { useState } from 'react'
import Papa from 'papaparse'
import { addExercise, saveWorkout, findExercises } from '../db'

// Groups Strong-export rows (one row per set) into workouts:
// rows sharing the same exact timestamp + workout name belong to one workout.
function groupIntoWorkouts(rows) {
  const map = new Map()
  for (const r of rows) {
    const rawDate = (r.Date || '').trim()
    if (!rawDate) continue
    const date = rawDate.slice(0, 10) // YYYY-MM-DD
    const title = (r['Workout Name'] || 'Workout').trim()
    const key = rawDate + '|' + title
    if (!map.has(key)) {
      map.set(key, { date, title, exerciseOrder: [], exerciseMap: new Map() })
    }
    const w = map.get(key)
    const exName = (r['Exercise Name'] || '').trim()
    if (!exName) continue
    const weight = parseFloat(r.Weight)
    const reps = parseFloat(r.Reps)
    if (!Number.isFinite(reps) || reps <= 0) continue
    if (!Number.isFinite(weight)) continue
    if (!w.exerciseMap.has(exName)) {
      w.exerciseMap.set(exName, [])
      w.exerciseOrder.push(exName)
    }
    w.exerciseMap.get(exName).push({ reps, weight })
  }

  return Array.from(map.values()).map((w) => ({
    date: w.date,
    title: w.title,
    exercises: w.exerciseOrder.map((name) => ({ name, sets: w.exerciseMap.get(name) }))
  }))
}

export default function ImportCSV({ onDone, onCancel }) {
  const [fileName, setFileName] = useState(null)
  const [parsed, setParsed] = useState(null) // all workouts from file
  const [monthFilter, setMonthFilter] = useState('') // '' = all, else 'YYYY-MM'
  const [status, setStatus] = useState(null)
  const [importing, setImporting] = useState(false)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const workouts = groupIntoWorkouts(result.data).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        )
        setParsed(workouts)
      }
    })
  }

  const months = parsed
    ? Array.from(new Set(parsed.map((w) => w.date.slice(0, 7)))).sort()
    : []

  const toImport = parsed
    ? monthFilter
      ? parsed.filter((w) => w.date.slice(0, 7) === monthFilter)
      : parsed
    : []

  async function handleImport() {
    setImporting(true)
    let newExerciseCount = 0
    const exerciseCache = new Map()

    for (const w of toImport) {
      const exercises = []
      for (const ex of w.exercises) {
        let exercise = exerciseCache.get(ex.name)
        if (!exercise) {
          const existing = await findExercises(ex.name)
          const exact = existing.find((e) => e.name.toLowerCase() === ex.name.toLowerCase())
          if (exact) {
            exercise = exact
          } else {
            exercise = await addExercise(ex.name, 'Other')
            newExerciseCount++
          }
          exerciseCache.set(ex.name, exercise)
        }
        exercises.push({ exerciseId: exercise.id, exerciseName: exercise.name, sets: ex.sets })
      }
      await saveWorkout({
        title: w.title,
        date: w.date,
        exercises,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      })
    }

    setStatus(`Imported ${toImport.length} workout${toImport.length !== 1 ? 's' : ''}, added ${newExerciseCount} new exercise${newExerciseCount !== 1 ? 's' : ''} to your library.`)
    setImporting(false)
    if (onDone) onDone()
  }

  return (
    <div>
      <button className="btn-ghost" onClick={onCancel}>
        ← Cancel
      </button>
      <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 12px' }}>
        Import from Strong
      </h2>

      {!parsed && (
        <div className="card">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Strong CSV export</label>
            <input type="file" accept=".csv" onChange={handleFile} />
          </div>
        </div>
      )}

      {parsed && !status && (
        <>
          <div className="card">
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Month to import</label>
              <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="">All months ({parsed.length} workouts)</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m} ({parsed.filter((w) => w.date.slice(0, 7) === m).length} workouts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginBottom: 8 }}>
              {toImport.length} workout{toImport.length !== 1 ? 's' : ''} will be imported from {fileName}
            </div>
            {toImport.slice(0, 8).map((w, i) => (
              <div key={i} style={{ fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                {w.date} — {w.title} ({w.exercises.length} exercises)
              </div>
            ))}
            {toImport.length > 8 && (
              <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: 6 }}>
                + {toImport.length - 8} more
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            disabled={toImport.length === 0 || importing}
            onClick={handleImport}
            style={{ opacity: toImport.length === 0 || importing ? 0.4 : 1 }}
          >
            {importing ? 'Importing…' : `Import ${toImport.length} workout${toImport.length !== 1 ? 's' : ''}`}
          </button>
        </>
      )}

      {status && (
        <div className="card">
          <p style={{ color: 'var(--pr)', margin: 0 }}>{status}</p>
        </div>
      )}
    </div>
  )
}
