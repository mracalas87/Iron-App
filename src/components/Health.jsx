import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { listWorkouts, listRuns, workoutVolume } from '../db'

const CACHE_KEY = 'iron-health-cache'
const ACCESS_KEY_STORAGE = 'iron-garmin-key'
const RECENT_DAYS = 14

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function secondsToHours(s) {
  return s ? Math.round((s / 3600) * 10) / 10 : 0
}

function readCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function average(arr, key) {
  const vals = arr.map((x) => x[key]).filter((v) => v != null && v > 0)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function Health() {
  const [accessKey, setAccessKey] = useState(() => {
    try {
      return localStorage.getItem(ACCESS_KEY_STORAGE) || ''
    } catch {
      return ''
    }
  })
  const [keyInput, setKeyInput] = useState('')
  const [data, setData] = useState(readCache)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [localEntries, setLocalEntries] = useState([])

  useEffect(() => {
    loadLocalEntries()
  }, [])

  async function loadLocalEntries() {
    const [workouts, runs] = await Promise.all([listWorkouts(), listRuns()])
    const cutoff = isoDaysAgo(RECENT_DAYS)

    const workoutEntries = workouts
      .filter((w) => w.date >= cutoff)
      .map((w) => ({
        key: `workout-${w.id}`,
        date: w.date,
        title: w.title,
        subtitle: `${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''} · ${workoutVolume(w)}kg volume`,
        source: 'Iron'
      }))

    const runEntries = runs
      .filter((r) => r.date >= cutoff)
      .map((r) => ({
        key: `run-${r.id}`,
        date: r.date,
        title: 'Run',
        subtitle: `${r.distanceKm}km · ${r.durationMin} min${r.notes ? ' · ' + r.notes : ''}`,
        source: 'Iron'
      }))

    setLocalEntries([...workoutEntries, ...runEntries])
  }

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/garmin', { headers: { 'x-garmin-key': accessKey } })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
      setData(json)
      localStorage.setItem(CACHE_KEY, JSON.stringify(json))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function saveKey() {
    const trimmed = keyInput.trim()
    localStorage.setItem(ACCESS_KEY_STORAGE, trimmed)
    setAccessKey(trimmed)
    setKeyInput('')
  }

  function forgetKey() {
    localStorage.removeItem(ACCESS_KEY_STORAGE)
    localStorage.removeItem(CACHE_KEY)
    setAccessKey('')
    setData(null)
  }

  if (!accessKey) {
    return (
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Garmin access key</label>
          <input
            type="password"
            placeholder="The key you set in Vercel"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 14 }}
          disabled={!keyInput.trim()}
          onClick={saveKey}
        >
          Save
        </button>
      </div>
    )
  }

  const days = (data?.days || []).slice().reverse() // oldest -> newest
  const stepsData = days.map((d) => ({
    label: formatDateShort(d.date),
    steps: !d.steps?.error ? d.steps : 0
  }))
  const hrData = days.map((d) => ({
    label: formatDateShort(d.date),
    restingHR: d.heartRate?.restingHeartRate || null
  }))
  const sleepData = days.map((d) => ({
    label: formatDateShort(d.date),
    hours: secondsToHours(d.sleep?.dailySleepDTO?.sleepTimeSeconds)
  }))
  const garminEntries = (data?.activities || []).map((a) => ({
    key: `garmin-${a.activityId}`,
    date: (a.startTimeLocal || '').slice(0, 10),
    title: a.activityName,
    subtitle: [
      a.distance ? `${(a.distance / 1000).toFixed(1)}km` : null,
      a.duration ? `${Math.round(a.duration / 60)} min` : null,
      a.averageHR ? `${a.averageHR} bpm avg` : null
    ]
      .filter(Boolean)
      .join(' · '),
    source: 'Garmin'
  }))

  const allActivities = [...garminEntries, ...localEntries].sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : 0
  )

  return (
    <div>
      <button className="btn btn-secondary" onClick={refresh} disabled={loading} style={{ marginBottom: 12 }}>
        {loading ? 'Refreshing…' : 'Refresh from Garmin'}
      </button>
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -6, marginBottom: 12 }}>{error}</p>
      )}
      {data?.fetchedAt && (
        <p style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: -6, marginBottom: 12 }}>
          Last synced {new Date(data.fetchedAt).toLocaleString('en-GB')}
        </p>
      )}

      {!data && allActivities.length === 0 ? (
        <div className="empty-state">
          <div className="mark">—</div>
          <p>No data yet. Tap "Refresh from Garmin" to pull your latest stats.</p>
        </div>
      ) : (
        <>
          {data && (
            <>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="label">Avg resting HR</div>
              <div className="value">{average(hrData, 'restingHR') ?? '—'} bpm</div>
            </div>
            <div className="metric-box">
              <div className="label">Avg sleep</div>
              <div className="value">{average(sleepData, 'hours') ?? '—'}h</div>
            </div>
          </div>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="label">Avg steps</div>
              <div className="value">{average(stepsData, 'steps')?.toLocaleString() ?? '—'}</div>
            </div>
            <div className="metric-box">
              <div className="label">Activities</div>
              <div className="value">{allActivities.length}</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--chalk-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Steps
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stepsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9aa0a6', fontSize: 10 }}
                  axisLine={{ stroke: '#33393f' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#4c7eff' }}
                  cursor={{ fill: '#ffffff', opacity: 0.05 }}
                />
                <Bar dataKey="steps" fill="#4c7eff" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--chalk-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Resting heart rate
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={hrData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9aa0a6', fontSize: 10 }}
                  axisLine={{ stroke: '#33393f' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  domain={['dataMin - 3', 'dataMax + 3']}
                />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#c9f24b' }}
                />
                <Line type="monotone" dataKey="restingHR" stroke="#c9f24b" strokeWidth={2} dot={{ r: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--chalk-dim)',
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Sleep (hours)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={sleepData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9aa0a6', fontSize: 10 }}
                  axisLine={{ stroke: '#33393f' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#4c7eff' }}
                  cursor={{ fill: '#ffffff', opacity: 0.05 }}
                />
                <Bar dataKey="hours" fill="#4c7eff" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
            </>
          )}

          {allActivities.length > 0 && (
            <div className="card" style={{ padding: 4 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--chalk-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '10px 10px 4px'
                }}
              >
                Recent activities
              </div>
              {allActivities.map((item) => (
                <div
                  key={item.key}
                  className="exercise-list-item"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, cursor: 'default' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 600 }}>{item.title}</span>
                    <span className="category">{formatDateShort(item.date)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--chalk-dim)' }}>
                    {item.subtitle} · {item.source}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-ghost"
            style={{ color: 'var(--danger)', display: 'block', margin: '12px auto 0' }}
            onClick={forgetKey}
          >
            Forget access key
          </button>
        </>
      )}
    </div>
  )
}
