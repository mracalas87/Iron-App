import { useEffect, useState } from 'react'
import { listWorkouts, listRuns, workoutVolume, syncRunsFromGarminCache, MUSCLE_GROUPS } from '../db'
import { getVitals, trendLabel, formatHrvStatus, round } from '../vitals'
import { buildAdvice, ADVICE_ZONES } from '../trainingAdvice'

const HEALTH_CACHE_KEY = 'iron-health-cache'

const ZONES = [
  { key: 'Strained', color: 'var(--danger)' },
  { key: 'Fair', color: 'var(--warn)' },
  { key: 'Good', color: 'var(--pr)' }
]
// Marker position (% along the gauge) for 0, 1, 2, 3, 4 and 5+ warning points.
const MARKER_POSITIONS = [88, 60, 45, 25, 14, 6]

function readHealthCache() {
  try {
    const cached = localStorage.getItem(HEALTH_CACHE_KEY)
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

function pctChange(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

function spread(values) {
  const present = values.filter((x) => x != null)
  return present.length ? { min: Math.min(...present), max: Math.max(...present) } : null
}

async function buildReport() {
  const [workouts, runs] = await Promise.all([listWorkouts(), listRuns()])

  const thisWeekStart = isoDaysAgo(6)
  const lastWeekStart = isoDaysAgo(13)

  const thisWeekWorkouts = workouts.filter((w) => w.date >= thisWeekStart)
  const lastWeekWorkouts = workouts.filter((w) => w.date >= lastWeekStart && w.date < thisWeekStart)
  const thisWeekRuns = runs.filter((r) => r.date >= thisWeekStart)
  const lastWeekRuns = runs.filter((r) => r.date >= lastWeekStart && r.date < thisWeekStart)

  const groupsThisWeek = new Set()
  thisWeekWorkouts.forEach((w) => (w.muscleGroups || []).forEach((g) => groupsThisWeek.add(g)))
  const missedGroups = MUSCLE_GROUPS.filter((g) => !groupsThisWeek.has(g))

  const volumeThisWeek = Math.round(thisWeekWorkouts.reduce((sum, w) => sum + workoutVolume(w), 0))
  const volumeLastWeek = Math.round(lastWeekWorkouts.reduce((sum, w) => sum + workoutVolume(w), 0))
  const volumeChange = pctChange(volumeThisWeek, volumeLastWeek)

  const runDistThisWeek = thisWeekRuns.reduce((sum, r) => sum + r.distanceKm, 0)
  const runDistLastWeek = lastWeekRuns.reduce((sum, r) => sum + r.distanceKm, 0)

  const health = readHealthCache()
  const v = getVitals(health)

  // ---- Status: each warning adds points by severity ----
  const reasons = []
  let points = 0
  const warn = (pts, text) => {
    points += pts
    reasons.push(text)
  }

  const sleepAvg = v.sleepHours.avg
  if (sleepAvg != null && sleepAvg < 6.5) warn(2, `Sleep averaging ${round(sleepAvg, 1)}h, well under 7h`)
  else if (sleepAvg != null && sleepAvg < 7) warn(1, `Sleep averaging ${round(sleepAvg, 1)}h, under 7h`)

  const rhrDelta = v.restingHR.delta
  if (rhrDelta != null && rhrDelta >= 5) warn(2, `Resting HR up ${round(rhrDelta)} bpm over the last 3 days`)
  else if (rhrDelta != null && rhrDelta >= 2) warn(1, `Resting HR up ${round(rhrDelta)} bpm over the last 3 days`)

  if (['LOW', 'POOR'].includes(v.hrvStatus)) warn(2, `HRV status is ${formatHrvStatus(v.hrvStatus).toLowerCase()}`)
  else if (v.hrvStatus === 'UNBALANCED') warn(1, 'HRV status is unbalanced')
  else if (v.hrv.deltaPct != null && v.hrv.deltaPct <= -25) warn(2, `HRV down ${Math.abs(round(v.hrv.deltaPct))}% over the last 3 days`)
  else if (v.hrv.deltaPct != null && v.hrv.deltaPct <= -15) warn(1, `HRV down ${Math.abs(round(v.hrv.deltaPct))}% over the last 3 days`)

  const hasHealth = v.hasData
  const status = !hasHealth ? '—' : points === 0 ? 'Good' : points <= 2 ? 'Fair' : 'Strained'
  const position = hasHealth ? MARKER_POSITIONS[Math.min(points, MARKER_POSITIONS.length - 1)] : null

  // ---- Detailed vitals rows ----
  const rhrRange = spread(v.restingHR.values)
  const hrvRange = spread(v.hrv.values)
  const sleepRange = spread(v.sleepHours.values)
  const hrvStatusText = formatHrvStatus(v.hrvStatus)

  const vitalRows = !hasHealth
    ? []
    : [
        {
          name: 'Resting heart rate',
          figure: v.restingHR.latest != null ? `${round(v.restingHR.latest)} bpm` : '—',
          trend: trendLabel(v.restingHR.delta, 'bpm', false),
          detail: rhrRange ? `avg ${round(v.restingHR.avg)} · range ${round(rhrRange.min)}-${round(rhrRange.max)}` : ''
        },
        {
          name: 'HRV (overnight)',
          figure: v.hrv.latest != null ? `${round(v.hrv.latest)} ms` : '—',
          trend: trendLabel(v.hrv.delta, 'ms', true),
          detail: hrvRange
            ? `${hrvStatusText ? hrvStatusText + ' · ' : ''}avg ${round(v.hrv.avg)} · range ${round(hrvRange.min)}-${round(hrvRange.max)}`
            : 'Not in saved data yet, refresh on the Health tab'
        },
        {
          name: 'Sleep',
          figure: v.sleepHours.latest != null ? `${round(v.sleepHours.latest, 1)} h` : '—',
          trend: trendLabel(v.sleepHours.delta != null ? v.sleepHours.delta * 60 : null, 'min', true),
          detail: sleepRange ? `avg ${round(v.sleepHours.avg, 1)}h · shortest ${round(sleepRange.min, 1)}h` : ''
        },
        {
          name: 'Deep sleep',
          figure: v.deepSleepHours.latest != null ? `${round(v.deepSleepHours.latest, 1)} h` : '—',
          trend: trendLabel(v.deepSleepHours.delta != null ? v.deepSleepHours.delta * 60 : null, 'min', true),
          detail: v.deepSleepHours.avg != null ? `avg ${round(v.deepSleepHours.avg, 1)}h` : ''
        },
        {
          name: 'Max heart rate (24h)',
          figure: v.maxHR.latest != null ? `${round(v.maxHR.latest)} bpm` : '—',
          trend: { text: '', color: 'var(--chalk-dim)' },
          detail: v.maxHR.avg != null ? `avg ${round(v.maxHR.avg)}` : ''
        },
        {
          name: 'Steps',
          figure: v.steps.avg != null ? Math.round(v.steps.avg).toLocaleString() : '—',
          trend: { text: '', color: 'var(--chalk-dim)' },
          detail: 'daily average'
        }
      ]

  // ---- Plain-language notes ----
  const notes = []

  if (thisWeekWorkouts.length === 0 && thisWeekRuns.length === 0) {
    notes.push('Nothing logged this week yet.')
  } else {
    const parts = []
    if (thisWeekWorkouts.length > 0) {
      parts.push(`${thisWeekWorkouts.length} strength session${thisWeekWorkouts.length !== 1 ? 's' : ''}`)
    }
    if (thisWeekRuns.length > 0) {
      parts.push(`${thisWeekRuns.length} run${thisWeekRuns.length !== 1 ? 's' : ''} (${round(runDistThisWeek, 1)}km)`)
    }
    notes.push(`This week: ${parts.join(' and ')}.`)
  }

  if (volumeThisWeek > 0 && volumeChange != null) {
    notes.push(
      `Strength volume is ${volumeChange >= 0 ? 'up' : 'down'} ${Math.abs(volumeChange)}% vs last week (${volumeLastWeek}kg → ${volumeThisWeek}kg).`
    )
  }

  if (runDistLastWeek > 0 && runDistThisWeek !== runDistLastWeek) {
    const runChange = pctChange(runDistThisWeek, runDistLastWeek)
    if (runChange != null) {
      notes.push(`Running distance is ${runChange >= 0 ? 'up' : 'down'} ${Math.abs(runChange)}% vs last week.`)
    }
  }

  if (thisWeekWorkouts.length > 0) {
    if (missedGroups.length === 0) {
      notes.push('All muscle groups trained this week.')
    } else {
      notes.push(`Not trained this week: ${missedGroups.join(', ')}.`)
    }
  }

  if (!hasHealth) {
    notes.push('No Garmin data yet. Go to the Health tab and tap "Refresh from Garmin".')
  } else if (reasons.length === 0) {
    notes.push('Recovery signals (sleep, resting HR, HRV) all look steady.')
  }

  const advice = buildAdvice({
    hasHealth,
    statusPoints: points,
    sleepLastNight: v.sleepHours.latest,
    workouts,
    runs,
    muscleGroups: MUSCLE_GROUPS,
    daysAgo: isoDaysAgo
  })

  return {
    status,
    position,
    reasons,
    advice,
    sessionsThisWeek: thisWeekWorkouts.length,
    runsThisWeek: thisWeekRuns.length,
    runKmThisWeek: round(runDistThisWeek, 1),
    volumeThisWeek,
    vitalRows,
    lastSynced: health?.fetchedAt || null,
    notes
  }
}

function statusColor(status) {
  return ZONES.find((z) => z.key === status)?.color || 'var(--chalk-dim)'
}

function StatusGauge({ zones = ZONES, status, position }) {
  return (
    <div className="gauge">
      <div className="gauge-track">
        {zones.map((z) => (
          <div
            key={z.key}
            className={`gauge-seg${status === z.key ? ' active' : ''}`}
            style={{ background: z.color, opacity: position == null ? 0.15 : undefined }}
          />
        ))}
      </div>
      {position != null && <div className="gauge-marker" style={{ left: `${position}%` }} />}
      <div className="gauge-labels">
        {zones.map((z) => (
          <span key={z.key} style={status === z.key ? { color: z.color, fontWeight: 700 } : undefined}>
            {z.key}
          </span>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--chalk-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 8
      }}
    >
      {children}
    </div>
  )
}

export default function Report() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    syncRunsFromGarminCache()
      .then(buildReport)
      .then(setStats)
  }, [])

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="mark">—</div>
        <p>Loading…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <SectionLabel>Today's status</SectionLabel>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: statusColor(stats.status) }}>
          {stats.status}
        </div>
        <StatusGauge status={stats.status} position={stats.position} />
        {stats.reasons.length > 0 && (
          <div style={{ fontSize: 13, marginTop: 12, color: 'var(--chalk-dim)' }}>
            {stats.reasons.map((r) => (
              <div key={r} style={{ padding: '2px 0' }}>
                {r}
              </div>
            ))}
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 14 }}>
          <SectionLabel>Training advice</SectionLabel>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: ADVICE_ZONES.find((z) => z.key === stats.advice.zone)?.color || 'var(--chalk-dim)'
            }}
          >
            {stats.advice.headline}
          </div>
          <StatusGauge zones={ADVICE_ZONES} status={stats.advice.zone} position={stats.advice.position} />
          {stats.advice.strength && (
            <div style={{ fontSize: 13, marginTop: 12, lineHeight: 1.5 }}>
              <div>
                <span style={{ color: 'var(--chalk-dim)' }}>Strength: </span>
                {stats.advice.strength}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ color: 'var(--chalk-dim)' }}>Run: </span>
                {stats.advice.run}
              </div>
            </div>
          )}
          {stats.advice.reasons.length > 0 && (
            <div style={{ fontSize: 12, marginTop: 10, color: 'var(--chalk-dim)' }}>
              Also: {stats.advice.reasons.join('. ')}.
            </div>
          )}
          {stats.advice.tip && (
            <div style={{ fontSize: 12, marginTop: 6, color: 'var(--chalk-dim)' }}>{stats.advice.tip}</div>
          )}
        </div>
        {stats.lastSynced && (
          <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 12 }}>
            Garmin data as of {new Date(stats.lastSynced).toLocaleString('en-GB')}
          </div>
        )}
      </div>

      {stats.vitalRows.length > 0 && (
        <div className="card">
          <SectionLabel>Vitals in detail</SectionLabel>
          {stats.vitalRows.map((row) => (
            <div className="vital-row" key={row.name}>
              <div>
                <div className="name">{row.name}</div>
                {row.detail && <div className="detail">{row.detail}</div>}
              </div>
              <div className="figure">
                <div>{row.figure}</div>
                {row.trend.text && (
                  <div style={{ fontSize: 11, color: row.trend.color, marginTop: 2 }}>{row.trend.text}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-box">
          <div className="label">Strength sessions (7d)</div>
          <div className="value">{stats.sessionsThisWeek}</div>
        </div>
        <div className="metric-box">
          <div className="label">Lifted (7d)</div>
          <div className="value">{stats.volumeThisWeek.toLocaleString()}kg</div>
        </div>
        <div className="metric-box">
          <div className="label">Runs (7d)</div>
          <div className="value">{stats.runsThisWeek}</div>
        </div>
        <div className="metric-box">
          <div className="label">Run distance (7d)</div>
          <div className="value">{stats.runKmThisWeek}km</div>
        </div>
      </div>

      <div className="card">
        <SectionLabel>Notes</SectionLabel>
        {stats.notes.map((n, i) => (
          <div
            key={i}
            style={{
              fontSize: 14,
              padding: '8px 0',
              borderBottom: i < stats.notes.length - 1 ? '1px solid var(--border)' : 'none'
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  )
}
