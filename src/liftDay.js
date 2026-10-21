// Works out which lift in the rolling cycle a logged workout was: shoulders (0), back (1),
// legs (2), chest (3) or arms (4).
//
// Andy titles his workouts, so the title is read first. If the title says nothing useful the
// muscle groups chosen when logging are used, and after that the exercises themselves
// (their saved muscle group, or their name). Biceps and triceps added to another muscle
// group are accessory work, so "Chest, Triceps" counts as chest; arms count when they are the
// whole workout. Legs also record whether the day leaned quads or hamstrings.

const GROUP_TOKEN = { Shoulders: 0, Back: 1, Quads: 2, Hamstrings: 2, Chest: 3, Biceps: 4, Triceps: 4 }

const PATTERNS = [
  [0, /shoulder|delts?\b|overhead press|\bohp\b|military press|lateral raise|face pull|arnold|rear delt|upright row/],
  [1, /\bback\b|\blats?\b|\brows?\b|pull[- ]?ups?|chin[- ]?ups?|pulldown|\btraps?\b|shrug|\bpull\b day/],
  [2, /\blegs?\b|quads?|hamstrings?|\bhams?\b|glutes?|calf|calves|squat|lunge|hip thrust|\brdl\b|romanian|leg press|leg curl|leg extension|hack squat|good morning/],
  [3, /chest|\bpecs?\b|bench|\bflyes?\b|\bfly\b|incline press|chest press|cable cross/],
  [4, /\barms?\b|biceps?|triceps?|\bcurls?\b|pushdown|skull ?crusher|\bdips?\b|hammer curl/]
]

const HAMSTRING = /hamstring|\bhams?\b|\brdl\b|romanian|leg curl|good morning|glute ham|stiff[- ]leg/
const QUAD = /quad|squat|leg press|leg extension|lunge|hack|step[- ]?up/

function tokensFromText(text) {
  const t = (text || '').toLowerCase().replace(/leg curl|hamstring curl|wrist curl/g, ' ')
  const hit = new Set()
  for (const [token, re] of PATTERNS) {
    if (re.test(t)) hit.add(token)
  }
  // "leg curl" is a hamstring exercise, not arms, but still counts as legs
  if (/leg curl|hamstring curl/.test((text || '').toLowerCase())) hit.add(2)
  return hit
}

function applyAccessoryRule(set) {
  const list = [...set]
  if (list.length > 1 && list.includes(4)) return list.filter((t) => t !== 4)
  return list
}

// workout: { title, muscleGroups, exercises: [{ exerciseId, exerciseName, sets }] }
// categoryOf: Map(exerciseId -> saved muscle group such as 'Chest', or 'Other')
export function classifyWorkout(workout, categoryOf = new Map()) {
  const title = workout.title || ''
  const names = (workout.exercises || []).map((e) => e.exerciseName || '').join(' ')
  let tokens = applyAccessoryRule(tokensFromText(title))
  let source = 'title'

  if (!tokens.length) {
    const groups = workout.muscleGroups || []
    const armsOnly = groups.length > 0 && groups.every((g) => g === 'Biceps' || g === 'Triceps')
    const hits = groups
      .filter((g) => armsOnly || (g !== 'Biceps' && g !== 'Triceps'))
      .map((g) => GROUP_TOKEN[g])
      .filter((t) => t != null)
    tokens = [...new Set(hits)]
    source = 'groups'
  }

  if (!tokens.length) {
    // Share of sets by lift, from each exercise's saved group or its name.
    const sets = [0, 0, 0, 0, 0]
    for (const ex of workout.exercises || []) {
      const n = (ex.sets || []).length || 1
      const cat = categoryOf.get(ex.exerciseId)
      let t = cat != null && cat in GROUP_TOKEN ? GROUP_TOKEN[cat] : null
      if (t == null) {
        const found = [...tokensFromText(ex.exerciseName)]
        t = found.length ? found[0] : null
      }
      if (t != null) sets[t] += n
    }
    const total = sets.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const share = sets.map((s) => s / total)
      let picked = [0, 1, 2, 3, 4].filter((t) => share[t] >= 0.35)
      if (picked.length > 1 && picked.includes(4) && share[4] < 0.5) picked = picked.filter((t) => t !== 4)
      tokens = picked
      source = 'exercises'
    }
  }

  let legsType = null
  if (tokens.includes(2)) {
    const text = `${title} ${names}`.toLowerCase()
    const h = HAMSTRING.test(text)
    const q = QUAD.test(text)
    if (h && !q) legsType = 'hamstring'
    else if (q && !h) legsType = 'quad'
    else if (h && q) {
      const count = (re) => (workout.exercises || []).filter((e) => re.test((e.exerciseName || '').toLowerCase())).length
      const ch = count(HAMSTRING)
      const cq = count(QUAD)
      legsType = ch > cq ? 'hamstring' : cq > ch ? 'quad' : null
    }
  }
  return { tokens, legsType, source }
}

const NAMES = ['Shoulders', 'Back', 'Legs', 'Chest', 'Arms']

export function groupsForTokens(tokens, legsType) {
  const out = []
  for (const t of tokens) {
    if (t === 0) out.push('Shoulders')
    else if (t === 1) out.push('Back')
    else if (t === 2) out.push(...(legsType === 'hamstring' ? ['Hamstrings'] : legsType === 'quad' ? ['Quads'] : ['Quads', 'Hamstrings']))
    else if (t === 3) out.push('Chest')
    else if (t === 4) out.push('Biceps', 'Triceps')
  }
  return out
}

export const liftName = (token) => NAMES[token]

// Copies of the workouts with `muscleGroups` replaced by what the workout really was, so the
// cycle, leg timing and advice all read the same thing. Workouts that cannot be classified
// keep what was logged.
export function annotateWorkouts(workouts, categoryOf) {
  return workouts.map((w) => {
    const lift = classifyWorkout(w, categoryOf)
    if (!lift.tokens.length) return { ...w, lift }
    return { ...w, muscleGroups: groupsForTokens(lift.tokens, lift.legsType), lift }
  })
}
