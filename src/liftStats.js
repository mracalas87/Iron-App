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

// The last ten workouts of a kind for one muscle group, oldest first. Only that muscle's exercises are counted, so a
// chest-and-triceps day shows its chest work on the Chest chart. `optimal` is one fixed target for the muscle and type
// (research.js), the same on every point, so the line to aim for does not move from workout to workout.
export function groupSeries(workouts, exercises, group, type, stats, setsFactor) {
  const categoryOf = new Map(exercises.map((e) => [e.id, e.category]))
  const reference = buildReference(workouts)
  const strengths = exercises.filter((e) => e.category === group).map((e) => reference.best.get(e.id)).filter(Boolean)
  const optimal = optimalVolume(type, strengths, { setsFactor })
  const target = optimalSets(type, { setsFactor })

  const rows = []
  for (const w of workouts) {
    let exs = (w.exercises || []).filter((e) => categoryOf.get(e.exerciseId) === group)
    // an older workout whose lifts were never filed under a muscle still counts when it was a single-muscle day
    if (!exs.length && (w.muscleGroups || []).length === 1 && w.muscleGroups[0] === group) exs = w.exercises || []
    if (!exs.length) continue
    const part = { ...w, exercises: exs }
    const kind = classifyDay([part], reference)
    if (!kind || kind.type !== type) continue
    const sets = workingSets([part])
    const topEst = Math.round(Math.max(...sets.map((x) => estimateBest(x.weight, x.reps))))
    rows.push({
      id: w.id,
      date: w.date,
      actual: Math.round(sum(sets.map((x) => x.weight * x.reps))),
      optimal,
      sets: kind.sets,
      optimalSets: target,
      medianReps: kind.medianReps,
      intensity: Math.round(kind.intensity * 100),
      topEst,
      perBodyweight: stats.weightKg ? Math.round((topEst / stats.weightKg) * 100) / 100 : null
    })
  }
  rows.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : (y.id || 0) - (x.id || 0)))
  return { rows: rows.slice(0, 10).reverse(), optimal, optimalSets: target, total: rows.length, hasLifts: strengths.length > 0 }
}

// One sentence on how the last ten compare with the target line.
export function verdict(type, rows, group) {
  const withDose = rows.filter((r) => r.optimal)
  if (withDose.length < 2) return null
  const ratio = sum(withDose.map((r) => r.actual)) / sum(withDose.map((r) => r.optimal))
  const pct = Math.round(ratio * 100)
  const reps = TYPE_INFO[type].reps
  if (ratio > 1.3) return `You lift about ${pct}% of the ${type.toLowerCase()} ${group.toLowerCase()} target. Sets past it add little and cost recovery, so keep the weight and trim sets if you feel flat.`
  if (ratio < 0.7) return `You lift about ${pct}% of the ${type.toLowerCase()} ${group.toLowerCase()} target. Adding a set or an exercise (${reps[0]} to ${reps[1]} reps) would bring you to it.`
  return `You are at about ${pct}% of the ${type.toLowerCase()} ${group.toLowerCase()} target, which is the right range.`
}
