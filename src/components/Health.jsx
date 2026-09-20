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
import { listWorkouts, listRuns, workoutVolume, importGarminRuns, syncRunsFromGarminCache } from '../db'
import { getVitals, trendLabel, formatHrvStatus, round } from '../vitals'

const CACHE_KEY = 'iron-health-cache'
const ACCESS_KEY_STORAGE = 'iron-garmin-key'
const RECENT_DAYS = 14

const tooltipStyle = { background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }
const axisTick = { fill: '#9aa0a6', fontSize: 10 }

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function readCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--chalk-dim)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      {children}
    </div>
  )
}

function VitalTile({ label, value, unit, sub, subColor }) {
  return (
    <div className="vital-tile">
      <div className="label">{label}</div>
      <div className="value">
        {value ?? '—'}
        {value != null && unit && <span className="unit">{unit}</span>}
      </div>
      <div className="sub" style={subColor ? { color: subColor } : undefined}>
        {sub || ' '}
      </div>
    </div>
  )
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
    syncRunsFromGarminCache().then(loadLocalEntries)
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
        source: 'Iron',
        runKm: r.distanceKm,
        fromGarmin: r.garminId != null
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
      await importGarminRuns(json.activities)
      await loadLocalEntries()
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

  const v = getVitals(data)
  const labels = v.dates.map(formatDateShort)
  const chartData = labels.map((label, i) => ({
    label,
    restingHR: v.restingHR.values[i],
    hrv: v.hrv.values[i],
    sleep: v.sleepHours.values[i] != null ? round(v.sleepHours.values[i], 1) : null
  }))
  const hasHrv = v.hrv.latest != null

  const rhrTrend = trendLabel(v.restingHR.delta, 'bpm', false)
  const hrvTrend = trendLabel(v.hrv.delta, 'ms', true)
  const sleepTrend = trendLabel(v.sleepHours.delta != null ? v.sleepHours.delta * 60 : null, 'min', true)

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
    source: 'Garmin',
    runKm: (a.activityType?.typeKey || '').includes('running') && a.distance ? a.distance / 1000 : null
  }))

  // Runs imported from Garmin (or matching a Garmin run) are already shown as Garmin entries.
  const ownEntries = localEntries.filter(
    (e) =>
      !e.fromGarmin &&
      !(
        e.runKm != null &&
        garminEntries.some((g) => g.runKm != null && g.date === e.date && Math.abs(g.runKm - e.runKm) < 0.3)
      )
  )

  const allActivities = [...garminEntries, ...ownEntries].sort((a, b) =>
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
                <VitalTile
                  label="HRV (overnight)"
                  value={round(v.hrv.latest)}
                  unit="ms"
                  sub={
                    hasHrv
                      ? `${formatHrvStatus(v.hrvStatus) ? formatHrvStatus(v.hrvStatus) + ' · ' : ''}${
                          hrvTrend.text || `avg ${round(v.hrv.avg)}`
                        }`
                      : 'Refresh to load HRV'
                  }
                  subColor={hasHrv && hrvTrend.text ? hrvTrend.color : undefined}
                />
                <VitalTile
                  label="Resting HR"
                  value={round(v.restingHR.latest)}
                  unit="bpm"
                  sub={
                    v.restingHR.avg != null
                      ? `7d avg ${round(v.restingHR.avg)}${rhrTrend.text ? ' · ' + rhrTrend.text : ''}`
                      : ''
                  }
                  subColor={rhrTrend.text ? rhrTrend.color : undefined}
                />
                <VitalTile
                  label="Sleep"
                  value={v.sleepHours.latest != null ? round(v.sleepHours.latest, 1) : null}
                  unit="h"
                  sub={
                    v.sleepHours.avg != null
                      ? `avg ${round(v.sleepHours.avg, 1)}h${
                          v.deepSleepHours.latest != null ? ` · deep ${round(v.deepSleepHours.latest, 1)}h` : ''
                        }`
                      : ''
                  }
                />
                <VitalTile
                  label="Max HR (24h)"
                  value={round(v.maxHR.latest)}
                  unit="bpm"
                  sub={v.maxHR.avg != null ? `7d avg ${round(v.maxHR.avg)}` : ''}
                />
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <SectionLabel>HRV (ms)</SectionLabel>
                {hasHrv ? (
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={axisTick}
                        axisLine={{ stroke: '#33393f' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#9aa0a6', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                        domain={['dataMin - 8', 'dataMax + 8']}
                      />
                      <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e8e6e1' }} itemStyle={{ color: '#4c7eff' }} />
                      <Line type="monotone" dataKey="hrv" stroke="#4c7eff" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--chalk-dim)' }}>
                    No HRV in the saved data yet. Tap Refresh from Garmin to load it.
                  </div>
                )}
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <SectionLabel>Resting heart rate (bpm)</SectionLabel>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={axisTick}
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
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e8e6e1' }} itemStyle={{ color: '#c9f24b' }} />
                    <Line type="monotone" dataKey="restingHR" stroke="#c9f24b" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ overflow: 'hidden' }}>
                <SectionLabel>Sleep (hours)</SectionLabel>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={axisTick}
                      axisLine={{ stroke: '#33393f' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: '#e8e6e1' }}
                      itemStyle={{ color: '#4c7eff' }}
                      cursor={{ fill: '#ffffff', opacity: 0.05 }}
                    />
                    <Bar dataKey="sleep" fill="#4c7eff" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {sleepTrend.text && (
                  <div style={{ fontSize: 12, color: sleepTrend.color, marginTop: 6 }}>
                    Last 3 nights vs before: {sleepTrend.text}
                  </div>
                )}
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
