import { MUSCLE_GROUPS } from './db'

// Sets per muscle group between two dates (inclusive). A set counts for its exercise's saved muscle
// group; sets from exercises without one are shared between the muscle groups chosen for that workout.
// Used by the heat map on the Log page and by the coach's summary of his weeks.
export function setsByGroup(workouts, categoryOf, since, until = '9999-12-31') {
  const sets = {}
  const add = (g, n) => {
    sets[g] = (sets[g] || 0) + n
  }
  for (const w of workouts) {
    if (w.date < since || w.date > until) continue
    let spare = 0
    for (const ex of w.exercises || []) {
      const n = (ex.sets || []).length
      const cat = categoryOf.get(ex.exerciseId)
      if (MUSCLE_GROUPS.includes(cat)) add(cat, n)
      else spare += n
    }
    const chips = (w.muscleGroups || []).filter((g) => MUSCLE_GROUPS.includes(g))
    if (spare > 0 && chips.length > 0) for (const g of chips) add(g, spare / chips.length)
  }
  return sets
}
