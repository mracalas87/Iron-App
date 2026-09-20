import { useEffect, useState } from 'react'
import { listWorkouts, listRuns, workoutVolume, syncRunsFromGarminCache, MUSCLE_GROUPS } from '../db'
import { buildAiSummary } from '../healthSummary'

const HEALTH_CACHE_KEY = 'iron-health-cache'
const ACCESS_KEY_STORAGE = 'iron-garmin-key'
const AI_CACHE_KEY = 'iron-ai-review'

function readAiCache() {
  try {
    const cached = localStorage.getItem(AI_CACHE_KEY)
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

function readHealthCache() {
  try {
    const cached = localStorage.getItem(HEALTH_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function average(nums) {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function pctChange(current, previous) {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
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

  const volumeThisWeek = thisWeekWorkouts.reduce((sum, w) => sum + workoutVolume(w), 0)
  const volumeLastWeek = lastWeekWorkouts.reduce((sum, w) => sum + workoutVolume(w), 0)
  const volumeChange = pctChange(volumeThisWeek, volumeLastWeek)

  const runDistThisWeek = thisWeekRuns.reduce((sum, r) => sum + r.distanceKm, 0)
  const runDistLastWeek = lastWeekRuns.reduce((sum, r) => sum + r.distanceKm, 0)

  const health = readHealthCache()
  const healthDays = (health?.days || []).slice().reverse() // oldest -> newest

  const restingHRs = healthDays.map((d) => d.heartRate?.restingHeartRate).filter((v) => v != null)
  const avgRestingHR = average(restingHRs)
  const recentHR = average(restingHRs.slice(-3))
  const earlierHR = average(restingHRs.slice(0, Math.max(restingHRs.length - 3, 0)))
  const hrDelta = recentHR != null && earlierHR != null ? recentHR - earlierHR : null

  const sleepHours = healthDays
    .map((d) => d.sleep?.dailySleepDTO?.sleepTimeSeconds)
    .filter((v) => v != null)
    .map((s) => s / 3600)
  const avgSleep = average(sleepHours)

  const stepsVals = healthDays.map((d) => (!d.steps?.error ? d.steps : null)).filter((v) => v != null)
  const avgSteps = average(stepsVals)

  // ---- Status heuristic ----
  const flags = []
  if (avgSleep != null && avgSleep < 7) flags.push('sleep')
  if (hrDelta != null && hrDelta >= 2) flags.push('hr')

  let status = 'Good'
  if (flags.length >= 2) status = 'Strained'
  else if (flags.length === 1) status = 'Fair'
  if (!health) status = '—'

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
      parts.push(`${thisWeekRuns.length} run${thisWeekRuns.length !== 1 ? 's' : ''} (${Math.round(runDistThisWeek * 10) / 10}km)`)
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

  if (!health) {
    notes.push('No Garmin data yet — go to the Health tab and tap "Refresh from Garmin".')
  } else {
    if (avgSleep != null) {
      notes.push(
        `Averaging ${Math.round(avgSleep * 10) / 10}h sleep${avgSleep < 7 ? ' — below the 7-9h recommended range' : ''}.`
      )
    }
    if (avgRestingHR != null) {
      let hrNote = `Resting heart rate averaging ${Math.round(avgRestingHR)} bpm`
      if (hrDelta != null && hrDelta >= 2) hrNote += `, trending up (${hrDelta >= 0 ? '+' : ''}${Math.round(hrDelta)} bpm recently) — a sign of accumulating fatigue`
      else if (hrDelta != null && hrDelta <= -2) hrNote += ', trending down — good recovery sign'
      notes.push(hrNote + '.')
    }
    if (avgSteps != null) {
      notes.push(`Averaging ${Math.round(avgSteps).toLocaleString()} steps/day.`)
    }
  }

  return {
    status,
    sessionsThisWeek: thisWeekWorkouts.length,
    runsThisWeek: thisWeekRuns.length,
    avgRestingHR,
    avgSleep,
    lastSynced: health?.fetchedAt || null,
    notes
  }
}

function statusColor(status) {
  if (status === 'Good') return 'var(--pr)'
  if (status === 'Fair') return 'var(--iron)'
  if (status === 'Strained') return 'var(--danger)'
  return 'var(--chalk-dim)'
}

export default function Report() {
  const [stats, setStats] = useState(null)
  const [review, setReview] = useState(readAiCache)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    syncRunsFromGarminCache()
      .then(buildReport)
      .then(setStats)
  }, [])

  async function generateReview() {
    setReviewLoading(true)
    setReviewError(null)
    try {
      const accessKey = localStorage.getItem(ACCESS_KEY_STORAGE)
      if (!accessKey) throw new Error('Enter your access key on the Health tab first.')
      const summary = await buildAiSummary(stats)
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-garmin-key': accessKey },
        body: JSON.stringify({ summary })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
      setReview(json)
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(json))
    } catch (err) {
      setReviewError(err.message)
    } finally {
      setReviewLoading(false)
    }
  }

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
      <div className="card" style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--chalk-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 6
          }}
        >
          Today's status
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--mono)', color: statusColor(stats.status) }}>
          {stats.status}
        </div>
        {stats.lastSynced && (
          <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 4 }}>
            Garmin data as of {new Date(stats.lastSynced).toLocaleString('en-GB')}
          </div>
        )}
      </div>

      <div className="metric-grid">
        <div className="metric-box">
          <div className="label">Sessions this week</div>
          <div className="value">{stats.sessionsThisWeek}</div>
        </div>
        <div className="metric-box">
          <div className="label">Runs this week</div>
          <div className="value">{stats.runsThisWeek}</div>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric-box">
          <div className="label">Avg resting HR</div>
          <div className="value">{stats.avgRestingHR != null ? Math.round(stats.avgRestingHR) : '—'} bpm</div>
        </div>
        <div className="metric-box">
          <div className="label">Avg sleep</div>
          <div className="value">{stats.avgSleep != null ? Math.round(stats.avgSleep * 10) / 10 : '—'}h</div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            fontSize: 12,
            color: 'var(--chalk-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 8
          }}
        >
          AI review
        </div>
        {review?.review && (
          <>
            <div style={{ fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{review.review}</div>
            {review.generatedAt && (
              <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 8 }}>
                Generated {new Date(review.generatedAt).toLocaleString('en-GB')}
              </div>
            )}
          </>
        )}
        {reviewError && (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: '8px 0 0' }}>{reviewError}</p>
        )}
        <button
          className="btn btn-secondary"
          onClick={generateReview}
          disabled={reviewLoading}
          style={{ marginTop: 12 }}
        >
          {reviewLoading ? 'Reviewing…' : review?.review ? 'Refresh AI review' : 'Generate AI review'}
        </button>
        <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 8 }}>
          Sends your last four weeks of training and Garmin data to an AI service. Not medical advice.
        </div>
      </div>

      <div className="card">
        <div
          style={{
            fontSize: 12,
            color: 'var(--chalk-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 8
          }}
        >
          Notes
        </div>
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
