// Works out which lift in the rolling cycle a logged workout was: shoulders (0), back (1),
// legs (2), chest (3) or arms (4). The main muscle group is the day, and it is the first one
// in the title (see classifyWorkout). Legs also record whether the day leaned quads or
// hamstrings.

const GROUP_TOKEN = { Shoulders: 0, Back: 1, Quads: 2, Hamstrings: 2, Chest: 3, Biceps: 4, Triceps: 4 }

const PATTERNS = [
  [0, /shoulder|delts?\b|overhead press|\bohp\b|military press|lateral raise|face pull|arnold|rear delt|upright row/],
  [1, /\bback\b(?! squat)|\blats?\b|\brows?\b|pull[- ]?ups?|chin[- ]?ups?|pulldown|\btraps?\b|shrug/],
  [2, /\blegs?\b|quads?|hamstrings?|\bhams?\b|glutes?|calf|calves|squat|lunge|hip thrust|\brdl\b|romanian|leg press|leg curl|leg extension|hack squat|good morning/],
  [3, /chest|\bpecs?\b|bench|\bflyes?\b|\bfly\b|incline press|chest press|cable cross/],
  [4, /\barms?\b|biceps?|triceps?|\bcurls?\b|pushdown|skull ?crusher|\bdips?\b|hammer curl/]
]

const HAMSTRING = /hamstring|\bhams?\b|\brdl\b|romanian|leg curl|good morning|glute ham|stiff[- ]leg/
const QUAD = /quad|squat|leg press|leg extension|lunge|hack|step[- ]?up/

// Lifts mentioned in some text, in the order they first appear.
function tokensFromText(text) {
  const lower = (text || '').toLowerCase()
  // blank out "leg curl" so it is not read as arms; it is still legs
  const cleaned = lower.replace(/leg curl|hamstring curl|wrist curl/g, (m) => ' '.repeat(m.length))
  const found = []
  for (const [token, re] of PATTERNS) {
    const m = re.exec(cleaned)
    if (m) found.push([token, m.index])
  }
  const lc = lower.search(/leg curl|hamstring curl/)
  if (lc >= 0 && !found.some((f) => f[0] === 2)) found.push([2, lc])
  return found.sort((a, b) => a[1] - b[1]).map((f) => f[0])
}

// workout: { title, muscleGroups, exercises: [{ exerciseId, exerciseName, sets }] }
// categoryOf: Map(exerciseId -> saved muscle group such as 'Chest', or 'Other')
//
// Each workout is one lift in the cycle: the main muscle group. Andy puts it first in the
// title, so the first muscle group named there wins ("Chest, Triceps" is chest). Failing
// that, the first muscle group chosen when logging, then whichever lift has most of the sets.
export function classifyWorkout(workout, categoryOf = new Map()) {
  const title = workout.title || ''
  const names = (workout.exercises || []).map((e) => e.exerciseName || '').join(' ')
  let tokens = []
  let source = 'title'

  const fromTitle = tokensFromText(title)
  if (fromTitle.length) tokens = [fromTitle[0]]

  if (!tokens.length) {
    const first = (workout.muscleGroups || []).map((g) => GROUP_TOKEN[g]).find((t) => t != null)
    if (first != null) tokens = [first]
    source = 'groups'
  }

  if (!tokens.length) {
    const sets = [0, 0, 0, 0, 0]
    for (const ex of workout.exercises || []) {
      const n = (ex.sets || []).length || 1
      const cat = categoryOf.get(ex.exerciseId)
      let t = cat != null && cat in GROUP_TOKEN ? GROUP_TOKEN[cat] : null
      if (t == null) {
        const found = tokensFromText(ex.exerciseName)
        t = found.length ? found[0] : null
      }
      if (t != null) sets[t] += n
    }
    const top = Math.max(...sets)
    if (top > 0) {
      tokens = [sets.indexOf(top)]
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
