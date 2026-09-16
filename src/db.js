import { openDB } from 'idb'

const DB_NAME = 'iron-log'
const DB_VERSION = 3

export const MUSCLE_GROUPS = [
  'Shoulders',
  'Chest',
  'Back',
  'Quads',
  'Hamstrings',
  'Biceps',
  'Triceps',
  'Abs'
]
export const CATEGORIES = [...MUSCLE_GROUPS, 'Other']

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('exercises')) {
        const store = db.createObjectStore('exercises', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by-name', 'name', { unique: true })
      }
      // v1 used a per-exercise "sessions" store. v2 replaces it with "workouts"
      // (one record per workout, containing multiple exercises each with sets).
      if (db.objectStoreNames.contains('sessions')) {
        db.deleteObjectStore('sessions')
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const store = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by-date', 'date')
      }
      if (!db.objectStoreNames.contains('runs')) {
        const store = db.createObjectStore('runs', { keyPath: 'id', autoIncrement: true })
        store.createIndex('by-date', 'date')
      }
    }
  })
}

// ---- Exercises ----

export async function listExercises() {
  const db = await getDB()
  const all = await db.getAll('exercises')
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

export async function findExercises(query) {
  const all = await listExercises()
  if (!query) return all
  const q = query.trim().toLowerCase()
  return all.filter((e) => e.name.toLowerCase().includes(q))
}

export async function addExercise(name, category) {
  const db = await getDB()
  const trimmed = name.trim()
  const existing = await db.getFromIndex('exercises', 'by-name', trimmed)
  if (existing) return existing
  const id = await db.add('exercises', {
    name: trimmed,
    category: category || 'Other',
    createdAt: new Date().toISOString()
  })
  return { id, name: trimmed, category: category || 'Other' }
}

export async function updateExerciseCategory(id, category) {
  const db = await getDB()
  const existing = await db.get('exercises', id)
  if (!existing) return
  await db.put('exercises', { ...existing, category })
}

// ---- Workouts ----
// workout shape: { id, title, date, createdAt, completedAt,
//                  exercises: [ { exerciseId, exerciseName, sets: [{reps, weight}] } ] }

export async function saveWorkout(workout) {
  const db = await getDB()
  const id = await db.add('workouts', workout)
  return id
}

export async function deleteWorkout(id) {
  const db = await getDB()
  await db.delete('workouts', id)
}

export async function updateWorkout(id, data) {
  const db = await getDB()
  await db.put('workouts', { ...data, id })
}

export async function listWorkouts() {
  const db = await getDB()
  const all = await db.getAll('workouts')
  return all.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)
}

export async function getWorkout(id) {
  const db = await getDB()
  return db.get('workouts', id)
}

// ---- Runs ----
// run shape: { id, date, distanceKm, durationMin, notes, createdAt }

export async function saveRun(run) {
  const db = await getDB()
  const id = await db.add('runs', run)
  return id
}

export async function deleteRun(id) {
  const db = await getDB()
  await db.delete('runs', id)
}

export async function listRuns() {
  const db = await getDB()
  const all = await db.getAll('runs')
  return all.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id)
}

// Returns chronological history for one exercise across all workouts, in a
// shape compatible with sessionMetrics: [{ date, sets, workoutId, workoutTitle }]
export async function exerciseHistory(exerciseId) {
  const workouts = await listWorkouts()
  const entries = []
  for (const w of workouts) {
    const matches = w.exercises.filter((e) => e.exerciseId === exerciseId)
    if (matches.length === 0) continue
    const sets = matches.flatMap((m) => m.sets)
    entries.push({ date: w.date, sets, workoutId: w.id, workoutTitle: w.title })
  }
  return entries.sort((a, b) => new Date(a.date) - new Date(b.date))
}

// ---- Derived metrics ----

// Epley formula: 1RM = weight * (1 + reps/30)
export function estimate1RM(weight, reps) {
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function sessionMetrics(entry) {
  const volume = entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  const best1RM = entry.sets.reduce((max, s) => Math.max(max, estimate1RM(s.weight, s.reps)), 0)
  const topSet = entry.sets.reduce((top, s) => (s.weight > (top?.weight ?? 0) ? s : top), null)
  return { volume, best1RM, topSet }
}

// The single best-ever set for an exercise (highest estimated 1RM across all
// past workouts, however long ago): { reps, weight } or null if never logged.
export async function bestSet(exerciseId) {
  const history = await exerciseHistory(exerciseId)
  let best = null
  let bestRM = -Infinity
  for (const entry of history) {
    for (const s of entry.sets) {
      const rm = estimate1RM(s.weight, s.reps)
      if (rm > bestRM) {
        bestRM = rm
        best = s
      }
    }
  }
  return best
}

export function workoutVolume(workout) {
  return workout.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + set.weight * set.reps, 0),
    0
  )
}

function localISODate(d) {
  const copy = new Date(d)
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset())
  return copy.toISOString().slice(0, 10)
}

// Total weight lifted per calendar day for the last `days` days (including
// rest days at 0), oldest first: [{ date: 'YYYY-MM-DD', volume }]
export async function dailyVolume(days = 30) {
  const workouts = await listWorkouts()
  const byDate = new Map()
  for (const w of workouts) {
    byDate.set(w.date, (byDate.get(w.date) || 0) + workoutVolume(w))
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = localISODate(d)
    result.push({ date: iso, volume: byDate.get(iso) || 0 })
  }
  return result
}
