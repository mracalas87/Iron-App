// Body stats used to set the research targets on the Lift tab (age, body weight, training experience).
// Kept on the phone only. Age and experience change the number of sets (research.js); body weight gives the
// protein range and the strength-to-body-weight ratio.

const KEY = 'iron-body-stats'

export const EXPERIENCE = [
  { id: 'beginner', label: 'Under 1 year', sets: 0.75 },
  { id: 'intermediate', label: '1 to 3 years', sets: 1 },
  { id: 'advanced', label: 'Over 3 years', sets: 1.1 }
]

export const DEFAULT_STATS = { age: 39, weightKg: null, experience: 'advanced', sessionsPerWeek: null } // null = work it out from your log

const num = (v, lo, hi) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null
}

export function readStats() {
  let raw = {}
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    raw = {}
  }
  return {
    age: num(raw.age, 14, 90) ?? DEFAULT_STATS.age,
    weightKg: num(raw.weightKg, 30, 250),
    experience: EXPERIENCE.some((e) => e.id === raw.experience) ? raw.experience : DEFAULT_STATS.experience,
    sessionsPerWeek: [1, 2, 3, 4].includes(Number(raw.sessionsPerWeek)) ? Number(raw.sessionsPerWeek) : null
  }
}

export function saveStats(patch) {
  const next = { ...readStats(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the change only lasts until the app is closed
  }
  return readStats()
}

// Recovery between hard sessions slows with age, so the research dose is trimmed a little from 40.
// The evidence on this is thin, so it is a nudge and not a rule.
export function ageFactor(age) {
  if (age < 40) return 1
  if (age < 50) return 0.92
  if (age < 60) return 0.85
  return 0.75
}

export function setsFactor(stats) {
  const exp = EXPERIENCE.find((e) => e.id === stats.experience) || EXPERIENCE[1]
  return Math.round(ageFactor(stats.age) * exp.sets * 100) / 100
}

// Daily protein for building or keeping muscle: 1.6 g per kg is the point where gains level off,
// up to about 2.2 g per kg to be safe (Morton 2018 meta-analysis).
export function proteinRange(weightKg) {
  return weightKg ? [Math.round(weightKg * 1.6), Math.round(weightKg * 2.2)] : null
}
