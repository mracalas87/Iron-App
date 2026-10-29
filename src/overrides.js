// Runs Andy has moved to another day with the "Do today" button in Coming up, kept on the phone:
// { plannedDate: newDate }. plan.js applies them (setMoves) when the report is built.

const KEY = 'iron-plan-moves'

export function readMoves() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const cut = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    // moves for days that have passed no longer matter
    return Object.fromEntries(Object.entries(raw).filter(([from, to]) => from >= cut || to >= cut))
  } catch {
    return {}
  }
}

function save(moves) {
  try {
    localStorage.setItem(KEY, JSON.stringify(moves))
  } catch {
    // storage blocked: the move only lasts until the app is closed
  }
}

export function moveRun(from, to) {
  save({ ...readMoves(), [from]: to })
}

export function undoMove(from) {
  const moves = readMoves()
  delete moves[from]
  save(moves)
}

// ---------- changes made by the coach (shown on Today with an Undo) ----------
// notes:    { date: 'short note' }               shown on that day in Coming up
// rest:     { date: 'reason' }                   a full rest day, no lifting and no run
// sessions: { id: { date, kind, text } }         extra runs, swims or rides Andy accepted from the coach

const NOTES = 'iron-coach-notes'
const REST = 'iron-coach-rest'
const SESSIONS = 'iron-coach-sessions'

function cutoff() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}') || {}
  } catch {
    return {}
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage blocked: the change only lasts until the app is closed
  }
}

export function readCoachExtras() {
  const cut = cutoff()
  const byDate = (key) => Object.fromEntries(Object.entries(readJson(key)).filter(([date]) => date >= cut))
  const sessions = Object.fromEntries(Object.entries(readJson(SESSIONS)).filter(([, s]) => s && s.date >= cut))
  return { notes: byDate(NOTES), rest: byDate(REST), sessions }
}

export function setCoachNote(date, text) {
  writeJson(NOTES, { ...readJson(NOTES), [date]: text })
}
export function clearCoachNote(date) {
  const m = readJson(NOTES)
  delete m[date]
  writeJson(NOTES, m)
}
export function setCoachRest(date, reason) {
  writeJson(REST, { ...readJson(REST), [date]: reason })
}
export function clearCoachRest(date) {
  const m = readJson(REST)
  delete m[date]
  writeJson(REST, m)
}
export function addCoachSession(session) {
  const id = `${session.date}-${session.kind}`
  writeJson(SESSIONS, { ...readJson(SESSIONS), [id]: session })
  return id
}
export function removeCoachSession(id) {
  const m = readJson(SESSIONS)
  delete m[id]
  writeJson(SESSIONS, m)
}
