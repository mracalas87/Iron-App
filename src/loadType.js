// Labels a day of lifting Heavy, Volume or Mixed.
//
// It does not use total kilos. Each working set is judged by how heavy the weight
// is for that lift: the weight against your own best estimated 1RM on it (which
// also reflects rep range, since a heavier weight means fewer reps). Warm-ups are
// left out. The day is then labelled by which kind of set dominates:
//
//   Heavy set  = 78%+ of your best on that lift (about 8 reps or fewer), or 5 reps or fewer
//   Volume set = 72% or less of your best (light weight, about 12+ reps), or 12 reps or more
//   Day        = Heavy or Volume if at least half its working sets are that kind
//                (and more than the other kind), otherwise Mixed.
//
// A lift with fewer than two sessions of history has no reliable best, so its
// intensity comes from its reps alone.

export const HEAVY_AT = 0.78
export const VOLUME_AT = 0.72
const WARMUP_BELOW = 0.7 // lighter than 70% of the day's top weight on that lift = warm-up

const epley = (weight, reps) => (reps <= 1 ? weight : weight * (1 + reps / 30))
const fromReps = (reps) => 1 / (1 + reps / 30)
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length
const median = (a) => {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.floor(s.length / 2)]
}

// Best estimated 1RM per exercise, and how many sessions it has history in.
export function buildReference(workouts) {
  const best = new Map()
  const bestAny = new Map()
  const sessions = new Map()
  for (const w of workouts) {
    const seen = new Set()
    for (const ex of w.exercises || []) {
      for (const s of ex.sets || []) {
        if (!(s.weight > 0) || !(s.reps > 0)) continue
        const e = epley(s.weight, s.reps)
        if (s.reps <= 10) best.set(ex.exerciseId, Math.max(best.get(ex.exerciseId) || 0, e))
        if (s.reps <= 20) bestAny.set(ex.exerciseId, Math.max(bestAny.get(ex.exerciseId) || 0, e))
        seen.add(ex.exerciseId)
      }
    }
    for (const id of seen) sessions.set(id, (sessions.get(id) || 0) + 1)
  }
  for (const [id, e] of bestAny) if (!best.has(id)) best.set(id, e)
  return { best, sessions }
}

// dayWorkouts: all workouts logged on one date. Returns null if nothing can be judged.
export function classifyDay(dayWorkouts, reference) {
  const sets = []
  for (const w of dayWorkouts) {
    for (const ex of w.exercises || []) {
      const valid = (ex.sets || []).filter((s) => s.weight > 0 && s.reps > 0)
      const top = Math.max(0, ...valid.map((s) => s.weight))
      for (const s of valid) if (s.weight >= WARMUP_BELOW * top) sets.push({ id: ex.exerciseId, reps: s.reps, weight: s.weight })
    }
  }
  if (!sets.length) return null

  let heavy = 0
  let volume = 0
  const intensities = sets.map((s) => {
    const best = reference.best.get(s.id)
    const history = reference.sessions.get(s.id) || 0
    const pct = Math.min(1.1, history >= 2 && best ? s.weight / best : fromReps(s.reps))
    if (pct >= HEAVY_AT || s.reps <= 5) heavy++
    else if (pct <= VOLUME_AT || s.reps >= 12) volume++
    return pct
  })
  const intensity = mean(intensities)
  const medianReps = median(sets.map((s) => s.reps))
  const heavyShare = heavy / sets.length
  const volumeShare = volume / sets.length

  let type = 'Mixed'
  if (heavyShare >= 0.5 && heavyShare > volumeShare) type = 'Heavy'
  else if (volumeShare >= 0.5 && volumeShare > heavyShare) type = 'Volume'

  return { type, intensity, medianReps, sets: sets.length, heavyShare, volumeShare }
}
