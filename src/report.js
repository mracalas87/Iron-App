import { listWorkouts, listRuns, listExercises, workoutVolume, dailyVolume, syncRunsFromGarminCache, MUSCLE_GROUPS } from './db'
import { annotateWorkouts } from './liftDay'
import { getVitals, trendLabel, formatHrvStatus, round } from './vitals'
import { buildAdvice, HARD_HR_FROM } from './trainingAdvice'
import { RACE } from './config'
import { getWeightSessions } from './weights'
import { buildUpcoming } from './upcoming'

const HEALTH_CACHE_KEY = 'iron-health-cache'

export const ZONES = [
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

export async function buildReport() {
  const [workoutsRaw, runs, recentDays, exercises] = await Promise.all([listWorkouts(), listRuns(), dailyVolume(60), listExercises()])
  // Read each logged lift (title, chosen muscle groups, the exercises done) so the cycle, leg
  // timing and advice all agree on what was trained.
  const categoryOf = new Map(exercises.map((e) => [e.id, e.category]))
  const workouts = annotateWorkouts(workoutsRaw, categoryOf)

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

  // Morning weights are not recorded; they are found from raised-heart-rate blocks (weights.js).
  const hrAvailable = (health?.days || []).some((d) => Array.isArray(d.hrHigh))
  const weightSessions = getWeightSessions(health)
  const weightDates = new Set(weightSessions.map((s) => s.date))
  const todayDate = isoDaysAgo(0)
  const weightsToday = weightSessions.find((s) => s.date === todayDate) || null
  const weightDays7 = new Set([
    ...thisWeekWorkouts.map((w) => w.date),
    ...weightSessions.filter((s) => s.date >= thisWeekStart).map((s) => s.date)
  ])
  const trainedDates = new Set([...weightDates, ...workouts.map((w) => w.date), ...runs.map((r) => r.date)])

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

  if (weightDays7.size === 0 && thisWeekRuns.length === 0) {
    notes.push('Nothing logged this week yet.')
  } else {
    const parts = []
    if (weightDays7.size > 0) {
      parts.push(`weights on ${weightDays7.size} day${weightDays7.size !== 1 ? 's' : ''}`)
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

  // How heavy or high-volume each logged lifting day was (loadType.js), and how you responded.
  const typedDays = recentDays.filter((d) => d.loadType)
  const loadTypes = new Map(typedDays.map((d) => [d.date, d.loadType]))
  const mix = { Heavy: 0, Volume: 0, Mixed: 0 }
  typedDays.filter((d) => d.date >= thisWeekStart).forEach((d) => mix[d.loadType]++)
  if (mix.Heavy + mix.Volume + mix.Mixed > 0) {
    const bits = [`${mix.Heavy} heavy`, `${mix.Volume} volume`]
    if (mix.Mixed) bits.push(`${mix.Mixed} mixed`)
    notes.push(`Logged lifting in the last 7 days: ${bits.join(', ')}.`)
  }
  if (hasHealth) {
    const byDate = new Map((health?.days || []).map((d) => [d.date, d]))
    const nextDay = (iso) => {
      const d = new Date(iso + 'T12:00:00Z')
      d.setUTCDate(d.getUTCDate() + 1)
      return d.toISOString().slice(0, 10)
    }
    const meanOf = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
    const after = (type) => {
      const rows = typedDays.filter((d) => d.loadType === type).map((d) => byDate.get(nextDay(d.date))).filter(Boolean)
      return {
        n: rows.length,
        hrv: meanOf(rows.map((r) => r.sleep?.avgOvernightHrv).filter((x) => x != null)),
        rhr: meanOf(rows.map((r) => r.heartRate?.restingHeartRate).filter((x) => x != null))
      }
    }
    const parts = ['Heavy', 'Volume']
      .map((t) => [t, after(t)])
      .filter(([, a]) => a.n >= 2 && a.hrv != null && a.rhr != null)
      .map(([t, a]) => `after ${t.toLowerCase()} days (${a.n}): HRV ${round(a.hrv)}, resting HR ${round(a.rhr)}`)
    if (parts.length) notes.push(`Next morning, ${parts.join('; ')}. Small samples, so treat as a hint.`)
  }

  if (hasHealth && !hrAvailable) {
    notes.push('Refresh from Garmin on the Health tab to include your morning weights sessions.')
  } else if (hasHealth) {
    const last14 = Array.from({ length: 14 }, (_, i) => isoDaysAgo(i))
    const liftDays = last14.filter((d) => weightDates.has(d) || workouts.some((w) => w.date === d)).length
    notes.push(`Weights on ${liftDays} of the last 14 days (found from your morning heart-rate blocks).`)
    const restDays = last14.slice(1).filter((d) => !trainedDates.has(d))
    const label = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    notes.push(
      restDays.length
        ? `Full rest days in the last 13: ${restDays.length}, most recent ${label(restDays[0])}.`
        : 'No full rest day in the last 13 days.'
    )
  }

  // Hard run yesterday (average heart rate in his threshold zone or above), and how far back run data goes.
  const garminActs = health?.activities || []
  const actDate = (a) => (a.startTimeLocal || '').slice(0, 10)
  const hardRun =
    garminActs
      .filter((a) => (a.activityType?.typeKey || '').includes('running') && (a.averageHR || 0) >= HARD_HR_FROM && (a.duration || 0) >= 600)
      .map((a) => ({ date: actDate(a), avgHR: a.averageHR }))
      .filter((a) => a.date >= isoDaysAgo(1))
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
  const historyStart = [...runs.map((r) => r.date), ...garminActs.map(actDate)].filter(Boolean).sort()[0] || null
  const liftDays14 = Array.from({ length: 14 }, (_, i) => isoDaysAgo(i)).filter(
    (d) => weightDates.has(d) || workouts.some((w) => w.date === d)
  ).length
  const runs28 = runs.filter((r) => r.date >= isoDaysAgo(27)).length
  const basis = `Based on ${v.dates.length} days of sleep, resting HR and HRV, ${liftDays14} lifting days in 14 days, and ${runs28} runs in 28 days.`

  const rides = garminActs
    .filter((a) => /cycl|biking/.test(a.activityType?.typeKey || '') && a.distance)
    .map((a) => ({ date: actDate(a), km: a.distance / 1000 }))
  const upcoming = buildUpcoming({
    today: todayDate,
    nowHour: new Date().getHours(),
    workouts,
    weightDates,
    runs,
    rides,
    loadTypes
  })

  const advice = buildAdvice({
    hasHealth,
    statusPoints: points,
    sleepLastNight: v.sleepHours.latest,
    workouts,
    runs,
    muscleGroups: MUSCLE_GROUPS,
    daysAgo: isoDaysAgo,
    weightDates,
    weightsToday,
    loadTypes,
    drift: (v.restingHR.delta != null && v.restingHR.delta >= 2) || (v.hrv.deltaPct != null && v.hrv.deltaPct <= -15),
    hardRun,
    historyStart,
    race: RACE
  })

  // Say which lift is due today when the cycle knows it and nothing has been lifted yet.
  if (upcoming.todayLift && advice.strength && !advice.strength.startsWith('Done')) {
    advice.strength = `${upcoming.todayLift === 'Off day' ? 'Off day, no lifting.' : upcoming.todayLift + ' day.'} ${advice.strength}`
  }

  return {
    status,
    position,
    reasons,
    advice,
    upcoming,
    basis,
    sessionsThisWeek: weightDays7.size,
    runsThisWeek: thisWeekRuns.length,
    runKmThisWeek: round(runDistThisWeek, 1),
    volumeThisWeek,
    vitalRows,
    lastSynced: health?.fetchedAt || null,
    notes
  }
}

export function statusColor(status) {
  return ZONES.find((z) => z.key === status)?.color || 'var(--chalk-dim)'
}
