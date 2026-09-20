import { listWorkouts, listRuns, workoutVolume, formatPace } from './db'

const HEALTH_CACHE_KEY = 'iron-health-cache'

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function round(n, places = 1) {
  const f = 10 ** places
  return Math.round(n * f) / f
}

function hours(seconds) {
  return seconds != null ? round(seconds / 3600) : null
}

function readHealthCache() {
  try {
    const cached = localStorage.getItem(HEALTH_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

// Compact snapshot of the last four weeks for the AI review.
export async function buildAiSummary(ruleBased) {
  const [workouts, runs] = await Promise.all([listWorkouts(), listRuns()])
  const since = isoDaysAgo(28)
  const activitySince = isoDaysAgo(14)
  const health = readHealthCache()

  return {
    today: isoDaysAgo(0),
    ironWorkouts: workouts
      .filter((w) => w.date >= since)
      .map((w) => ({
        date: w.date,
        title: w.title,
        muscleGroups: w.muscleGroups || [],
        exercises: w.exercises.length,
        volumeKg: Math.round(workoutVolume(w))
      })),
    runs: runs
      .filter((r) => r.date >= since)
      .map((r) => ({
        date: r.date,
        km: r.distanceKm,
        minutes: r.durationMin,
        pace: formatPace(r.distanceKm, r.durationMin),
        source: r.garminId != null ? 'Garmin' : 'Iron'
      })),
    garminOtherActivities: (health?.activities || [])
      .filter((a) => !(a.activityType?.typeKey || '').includes('running'))
      .filter((a) => (a.startTimeLocal || '').slice(0, 10) >= activitySince)
      .map((a) => ({
        date: (a.startTimeLocal || '').slice(0, 10),
        name: a.activityName,
        type: a.activityType?.typeKey,
        minutes: a.duration ? Math.round(a.duration / 60) : null,
        avgHR: a.averageHR ?? null,
        maxHR: a.maxHR ?? null
      })),
    garminDaily: (health?.days || [])
      .slice()
      .reverse()
      .map((d) => ({
        date: d.date,
        restingHR: d.heartRate?.restingHeartRate ?? null,
        sleepHours: hours(d.sleep?.dailySleepDTO?.sleepTimeSeconds),
        deepSleepHours: hours(d.sleep?.dailySleepDTO?.deepSleepSeconds),
        remSleepHours: hours(d.sleep?.dailySleepDTO?.remSleepSeconds),
        overnightHrv: d.sleep?.avgOvernightHrv ?? null,
        hrvStatus: d.sleep?.hrvStatus ?? null,
        steps: typeof d.steps === 'number' ? d.steps : null
      })),
    ruleBasedStatus: ruleBased ? { status: ruleBased.status, notes: ruleBased.notes } : null
  }
}
