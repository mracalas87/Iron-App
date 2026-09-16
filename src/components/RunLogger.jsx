import { useState } from 'react'
import { saveRun } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function RunLogger() {
  const [date, setDate] = useState(todayISO())
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)

  const canSave = Number(distance) > 0 && Number(duration) > 0

  async function handleSave() {
    await saveRun({
      date,
      distanceKm: Number(distance),
      durationMin: Number(duration),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    })
    setDistance('')
    setDuration('')
    setNotes('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="card">
        <div className="field">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Distance (km)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="5.0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Duration (minutes)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="25"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes (optional)</label>
          <input
            type="text"
            placeholder="e.g. easy pace, felt good"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <button
        className="btn btn-primary"
        disabled={!canSave}
        onClick={handleSave}
        style={{ opacity: canSave ? 1 : 0.4 }}
      >
        Save run
      </button>
      {saved && (
        <p style={{ color: 'var(--pr)', fontSize: 13, textAlign: 'center' }}>Run saved.</p>
      )}
    </div>
  )
}
