// Helpers for the Lift tab: each logged workout labelled Heavy, Mixed or Volume (loadType.js), grouped by muscle,
// with the best recorded one of each kind and the last ten of each kind against the research dose (research.js).

import { buildReference, classifyDay, workingSets, estimateBest } from './loadType'
import { optimalVolume, optimalSets, TYPE_INFO } from './research'
import { MUSCLE_GROUPS } from './db'

// The muscle groups a workout counts for: the ones chosen when it was started, else the groups of its exercises.
function groupsOf(w, categoryOf) {
  const chosen = (w.muscleGroups || []).filter((g) => MUSCLE_GROUPS.includes(g))
  if (chosen.length) return chosen
  return [...new Set((w.exercises || []).map((e) => categoryOf.get(e.exerciseId)).filter((c) => MUSCLE_GROUPS.includes(c)))]
}

const sum = (a) => a.reduce((x, y) => x + y, 0)

// Every workout that can be judged, newest first:
// { workout, id, date, type, groups, volume, sets, medianReps, intensity, topEst }
// volume = kg lifted on the working sets (warm-ups left out); topEst = the best estimated 1RM in the workout.
export function typedWorkouts(workouts, categoryOf) {
  const reference = buildReference(workouts)
  const out = []
  for (const w of workouts) {
    const kind = classifyDay([w], reference)
    if (!kind) continue
    const sets = workingSets([w])
    out.push({
      workout: w,
      id: w.id,
      date: w.date,
      type: kind.type,
      groups: groupsOf(w, categoryOf),
      volume: Math.round(sum(sets.map((s) => s.weight * s.reps))),
      sets: kind.sets,
      medianReps: kind.medianReps,
      intensity: Math.round(kind.intensity * 100),
      topEst: Math.round(Math.max(...sets.map((s) => estimateBest(s.weight, s.reps))))
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id || 0) - (a.id || 0)))
}

// The best recorded workout of a kind: Heavy by its highest estimated 1RM, Mixed and Volume by kg lifted.
export function topWorkout(list, type) {
  const of = list.filter((t) => t.type === type)
  if (!of.length) return null
  const score = (t) => (type === 'Heavy' ? t.topEst * 1e6 + t.volume : t.volume)
  return of.reduce((best, t) => (score(t) > score(best) ? t : best))
}

// The last ten workouts of a kind, oldest first, each with the research dose for the same lifts.
export function lastTen(typed, type, workouts, stats, setsFactor) {
  const reference = buildReference(workouts)
  const rows = typed
    .filter((t) => t.type === type)
    .slice(0, 10)
    .reverse()
    .map((t) => {
      const ids = [...new Set(workingSets([t.workout]).map((s) => s.id))]
      const strengths = ids.map((id) => reference.best.get(id)).filter(Boolean)
      const nGroups = Math.max(1, t.groups.length)
      return {
        id: t.id,
        date: t.date,
        actual: t.volume,
        optimal: optimalVolume(type, strengths, { setsFactor, nGroups }),
        sets: t.sets,
        optimalSets: optimalSets(type, { setsFactor, nGroups }),
        medianReps: t.medianReps,
        intensity: t.intensity,
        topEst: t.topEst,
        perBodyweight: stats.weightKg ? Math.round((t.topEst / stats.weightKg) * 100) / 100 : null
      }
    })
  return rows
}

// One sentence on how the last ten compare with the research dose.
export function verdict(type, rows) {
  const withDose = rows.filter((r) => r.optimal)
  if (withDose.length < 2) return null
  const ratio = sum(withDose.map((r) => r.actual)) / sum(withDose.map((r) => r.optimal))
  const pct = Math.round(ratio * 100)
  const reps = TYPE_INFO[type].reps
  if (ratio > 1.3) return `You lift about ${pct}% of the research volume for a ${type.toLowerCase()} session. Sets past that add little and cost recovery, so keep the weight and trim sets if you feel flat.`
  if (ratio < 0.7) return `You lift about ${pct}% of the research volume for a ${type.toLowerCase()} session. Adding a set or an exercise (${reps[0]} to ${reps[1]} reps) would bring you to it.`
  return `You are at about ${pct}% of the research volume for a ${type.toLowerCase()} session, which is the right range.`
}
