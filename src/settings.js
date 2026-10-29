import { DEFAULT_RULES } from './plan'

// The few rules Andy can change in the Plan tab (App rules), kept on the phone. plan.js holds the
// defaults and applies whatever is saved here when the report is built.

const KEY = 'iron-rules'

const clamp = (n, lo, hi, fallback) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Math.round(Number(n)))) : fallback)

// Which of the five lifts are in the rotation: whole numbers 0 to 4, no repeats, at least three.
function cleanLifts(list, fallback) {
  if (!Array.isArray(list)) return fallback
  const set = [...new Set(list.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 4))].sort()
  return set.length >= 3 ? set : fallback
}

export function readRules() {
  let raw = {}
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    raw = {}
  }
  const d = DEFAULT_RULES
  return {
    spacingDays: clamp(raw.spacingDays, 3, 7, d.spacingDays),
    restAfter: clamp(raw.restAfter, 3, 7, d.restAfter),
    legsBuffer: clamp(raw.legsBuffer, 1, 3, d.legsBuffer),
    longRunKm: clamp(raw.longRunKm, 10, 25, d.longRunKm),
    keyRunNoLift: raw.keyRunNoLift !== false,
    activeLifts: cleanLifts(raw.activeLifts, d.activeLifts),
    custom: typeof raw.custom === 'string' ? raw.custom.slice(0, 800) : ''
  }
}

export function saveRules(patch) {
  const next = { ...readRules(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the change only lasts until the app is closed
  }
  return next
}

// What he is aiming for, which the coach reads: a level for each race (fun or competitive), the lifting goal
// (hold his muscle, or hold it and try to gain some), and what his life allows right now.
const GOALS_KEY = 'iron-goals'
export const DEFAULT_GOALS = { lisbon: 'fun', cascais: 'fun', lifting: 'gain', period: 'normal' }
const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback)

export function readGoals() {
  let raw = {}
  try {
    raw = JSON.parse(localStorage.getItem(GOALS_KEY) || '{}') || {}
  } catch {
    raw = {}
  }
  const d = DEFAULT_GOALS
  return {
    lisbon: pick(raw.lisbon, ['fun', 'competitive'], d.lisbon),
    cascais: pick(raw.cascais, ['fun', 'competitive'], d.cascais),
    lifting: pick(raw.lifting, ['hold', 'gain'], d.lifting),
    period: pick(raw.period, ['normal', 'busy', 'more'], d.period)
  }
}

export function saveGoals(patch) {
  const next = { ...readGoals(), ...patch }
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(next))
  } catch {
    // storage blocked: the change only lasts until the app is closed
  }
  return next
}

export function resetRules() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // nothing to clear
  }
  return readRules()
}
