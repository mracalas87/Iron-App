import { listWorkouts, listRuns, workoutVolume } from './db'
import { getWeightSessions, clock } from './weights'

const RECENT_DAYS = 14

const isoDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// Workouts and runs logged on this phone in the last two weeks.
export async function loadLocalEntries() {
  const [workouts, runs] = await Promise.all([listWorkouts(), listRuns()])
  const cutoff = isoDaysAgo(RECENT_DAYS)
  const workoutEntries = workouts
    .filter((w) => w.date >= cutoff)
    .map((w) => ({
      key: `workout-${w.id}`,
      date: w.date,
      title: w.title,
      subtitle: `${w.exercises.length} exercise${w.exercises.length !== 1 ? 's' : ''} · ${Math.round(workoutVolume(w))}kg`,
      source: 'Iron'
    }))
  const runEntries = runs
    .filter((r) => r.date >= cutoff)
    .map((r) => ({
      key: `run-${r.id}`,
      date: r.date,
      title: 'Run',
      subtitle: `${r.distanceKm}km · ${r.durationMin} min`,
      source: 'Iron',
      runKm: r.distanceKm,
      fromGarmin: r.garminId != null
    }))
  return [...workoutEntries, ...runEntries]
}

// One date-sorted feed: Garmin activities, runs and workouts logged here, and morning
// weights found from heart rate (linked to a logged workout on the same day).
export function buildFeed(data, localEntries, limit = 20) {
  const garminEntries = (data?.activities || []).map((a) => ({
    key: `garmin-${a.activityId}`,
    date: (a.startTimeLocal || '').slice(0, 10),
    title: a.activityName,
    subtitle: [
      a.distance ? `${(a.distance / 1000).toFixed(1)}km` : null,
      a.duration ? `${Math.round(a.duration / 60)} min` : null,
      a.averageHR ? `${a.averageHR} bpm` : null
    ]
      .filter(Boolean)
      .join(' · '),
    source: 'Garmin',
    runKm: (a.activityType?.typeKey || '').includes('running') && a.distance ? a.distance / 1000 : null
  }))

  const ownEntries = localEntries.filter(
    (e) =>
      !e.fromGarmin &&
      !(e.runKm != null && garminEntries.some((g) => g.runKm != null && g.date === e.date && Math.abs(g.runKm - e.runKm) < 0.3))
  )

  const sessions = getWeightSessions(data)
  const linkedOwn = ownEntries.map((e) => {
    if (e.runKm != null) return e
    const s = sessions.find((x) => x.date === e.date)
    return s ? { ...e, subtitle: `${e.subtitle} · ${clock(s.start)}-${clock(s.end)}` } : e
  })
  const weightEntries = sessions
    .filter((s) => !ownEntries.some((e) => e.date === s.date && e.runKm == null))
    .map((s) => ({
      key: `weights-${s.date}-${s.start}`,
      date: s.date,
      title: 'Weights',
      subtitle: `${clock(s.start)}-${clock(s.end)} · ${s.hotMin} min`,
      source: 'Heart rate'
    }))

  return [...garminEntries, ...linkedOwn, ...weightEntries]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit)
}
