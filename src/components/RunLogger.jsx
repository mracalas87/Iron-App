import { useEffect, useState } from 'react'
import { saveRun, listRuns, formatPace, syncRunsFromGarminCache } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function RunLogger() {
  const [date, setDate] = useState(todayISO())
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [recentRuns, setRecentRuns] = useState([])

  useEffect(() => {
    syncRunsFromGarminCache().then(loadRecent)
  }, [])

  async function loadRecent() {
    const all = await listRuns()
    setRecentRuns(all.slice(0, 5))
  }

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
    loadRecent()
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

      {recentRuns.length > 0 && (
        <div className="card" style={{ padding: 4, marginTop: 12 }}>
          <div
            style={{
              fontSize: 12,
              color: 'var(--chalk-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '10px 10px 4px'
            }}
          >
            Recent runs
          </div>
          {recentRuns.map((r) => (
            <div
              key={r.id}
              className="exercise-list-item"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, cursor: 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 600 }}>{r.distanceKm}km</span>
                <span className="category">{formatDate(r.date)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--chalk-dim)' }}>
                {r.durationMin} min · {formatPace(r.distanceKm, r.durationMin)}
                {r.garminId != null ? ' · Garmin' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
