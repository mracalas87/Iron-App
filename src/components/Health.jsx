import { useState } from 'react'
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

const CACHE_KEY = 'iron-health-cache'
const ACCESS_KEY_STORAGE = 'iron-garmin-key'

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
  const activities = data?.activities || []

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

      {!data ? (
        <div className="empty-state">
          <div className="mark">—</div>
          <p>No data yet. Tap "Refresh from Garmin" to pull your latest stats.</p>
        </div>
      ) : (
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
              <div className="value">{activities.length}</div>
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

          {activities.length > 0 && (
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
              {activities.map((a) => (
                <div
                  key={a.activityId}
                  className="exercise-list-item"
                  style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, cursor: 'default' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontWeight: 600 }}>{a.activityName}</span>
                    <span className="category">{formatDateShort((a.startTimeLocal || '').slice(0, 10))}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--chalk-dim)' }}>
                    {a.distance ? `${(a.distance / 1000).toFixed(1)}km · ` : ''}
                    {a.duration ? `${Math.round(a.duration / 60)} min` : ''}
                    {a.averageHR ? ` · ${a.averageHR} bpm avg` : ''}
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
