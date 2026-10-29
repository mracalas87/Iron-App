import { RACES, RUN_SESSIONS, getRules } from './plan'
import { readMoves, moveRun, undoMove, readCoachExtras, setCoachNote, clearCoachNote, setCoachRest, clearCoachRest, addCoachSession, removeCoachSession } from './overrides'
import { saveRules } from './settings'

// The coach's review of today and the week ahead: ask for it, check it, apply what is safe.
//
// What the coach may change by itself (each shown on Today with an Undo): lighten the day in words,
// move a planned run, make a day a full rest day, leave a note on a day, and nudge a rule such as the
// days between the same lift. Anything that adds training is only an offer: Andy accepts or declines.
// Everything is checked here before it is applied, so a bad answer cannot do anything odd.

const KEY = 'iron-coach-review'
const RULE_FIELDS = { spacingDays: [3, 7], restAfter: [3, 7], legsBuffer: [1, 3], longRunKm: [10, 25] }
const KINDS = ['Run', 'Swim', 'Ride']

export function readReview() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null')
    return r && typeof r === 'object' ? r : null
  } catch {
    return null
  }
}

export function saveReview(review) {
  try {
    localStorage.setItem(KEY, JSON.stringify(review))
  } catch {
    // storage blocked: the review only lasts until the app is closed
  }
}

export async function requestReview({ context, accessKey, today }) {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-garmin-key': accessKey || '' },
    body: JSON.stringify({ mode: 'review', context, today })
  })
  const raw = await res.text()
  let data = null
  try {
    data = JSON.parse(raw)
  } catch {
    // not JSON: the function is not there (for example on a local test server)
  }
  if (!res.ok || !data || !data.review) {
    throw new Error((data && data.error) || (res.status === 404 ? 'The coach is not available here.' : `The coach did not answer (status ${res.status}).`))
  }
  return data.review
}

const isoAdd = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
const str = (x, n) => (typeof x === 'string' ? x.trim().slice(0, n) : '')
const shortDay = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

// Keep only what is safe from the coach's raw answer. Returns { headline, lift, run, why, actions, offers }.
export function cleanReview(raw, today) {
  const last = isoAdd(today, 7)
  const inWeek = (d) => isDate(d) && d >= today && d <= last
  const raceDates = new Set(RACES.map((r) => r.date))
  const moves = readMoves()
  const extras = readCoachExtras()
  const out = { headline: str(raw && raw.headline, 140), lift: str(raw && raw.lift, 180), run: str(raw && raw.run, 200), why: str(raw && raw.why, 200), week: str(raw && raw.week, 280), actions: [], offers: [] }

  for (const a of Array.isArray(raw && raw.actions) ? raw.actions : []) {
    if (out.actions.length >= 3 || !a || typeof a !== 'object') continue
    if (a.type === 'move_run') {
      const ok = isDate(a.from) && inWeek(a.to) && a.from in RUN_SESSIONS && !(a.to in RUN_SESSIONS) && a.from !== a.to && !(a.from in moves) && !raceDates.has(a.to) && a.from >= today
      if (ok) out.actions.push({ type: 'move_run', from: a.from, to: a.to, reason: str(a.reason, 100) })
    } else if (a.type === 'rest_day') {
      const planned = a.date in RUN_SESSIONS && !(a.date in moves)
      const ok = inWeek(a.date) && a.date > today && !raceDates.has(a.date) && !planned && !(a.date in extras.rest)
      if (ok) out.actions.push({ type: 'rest_day', date: a.date, reason: str(a.reason, 100) })
    } else if (a.type === 'note') {
      const text = str(a.text, 120)
      if (inWeek(a.date) && text && extras.notes[a.date] !== text) out.actions.push({ type: 'note', date: a.date, text })
    } else if (a.type === 'set_rule') {
      const range = RULE_FIELDS[a.field]
      const value = Math.round(Number(a.value))
      if (range && Number.isFinite(value) && value >= range[0] && value <= range[1] && getRules()[a.field] !== value) {
        out.actions.push({ type: 'set_rule', field: a.field, value, reason: str(a.reason, 100) })
      }
    }
  }

  for (const o of Array.isArray(raw && raw.offers) ? raw.offers : []) {
    if (out.offers.length >= 2 || !o || typeof o !== 'object') continue
    const kind = KINDS.find((k) => k.toLowerCase() === String(o.kind || '').toLowerCase())
    const text = str(o.text, 180)
    const taken = Object.values(extras.sessions).some((s) => s.date === o.date && s.kind === kind)
    if (kind && text && inWeek(o.date) && !raceDates.has(o.date) && !taken) out.offers.push({ date: o.date, kind, text, reason: str(o.reason, 100) })
  }
  return out
}

// Apply the checked actions. Returns what was done, each with what is needed to undo it.
export function applyActions(actions) {
  const applied = []
  for (const a of actions) {
    if (a.type === 'move_run') {
      moveRun(a.from, a.to)
      applied.push({ type: a.type, key: a.from, label: `Moved the ${shortDay(a.from)} run to ${shortDay(a.to)}${a.reason ? ': ' + a.reason : ''}` })
    } else if (a.type === 'rest_day') {
      setCoachRest(a.date, a.reason || 'coach')
      applied.push({ type: a.type, key: a.date, label: `${shortDay(a.date)} is now a full rest day${a.reason ? ': ' + a.reason : ''}` })
    } else if (a.type === 'note') {
      setCoachNote(a.date, a.text)
      applied.push({ type: a.type, key: a.date, label: `Note on ${shortDay(a.date)}: ${a.text}` })
    } else if (a.type === 'set_rule') {
      const previous = getRules()[a.field]
      saveRules({ [a.field]: a.value })
      applied.push({ type: a.type, key: a.field, previous, label: `Changed a rule (${RULE_NAMES[a.field]}) from ${previous} to ${a.value}${a.reason ? ': ' + a.reason : ''}` })
    }
  }
  return applied
}

const RULE_NAMES = { spacingDays: 'days before the same lift again', restAfter: 'lifting days before an off day', legsBuffer: 'days legs stay clear of a long run', longRunKm: 'km that counts as a long run' }

export function undoApplied(a) {
  if (a.type === 'move_run') undoMove(a.key)
  else if (a.type === 'rest_day') clearCoachRest(a.key)
  else if (a.type === 'note') clearCoachNote(a.key)
  else if (a.type === 'set_rule') saveRules({ [a.key]: a.previous })
}

// An offer Andy accepts becomes a session in Coming up.
export function acceptOffer(offer) {
  const id = addCoachSession({ date: offer.date, kind: offer.kind, text: offer.text })
  return { type: 'session', key: id, label: `Added ${offer.kind.toLowerCase()} on ${shortDay(offer.date)}: ${offer.text}` }
}

export function undoSession(a) {
  removeCoachSession(a.key)
}

// For the coach's context: what it has already changed, so it does not repeat itself.
export function coachChangeLines() {
  const lines = []
  const moves = readMoves()
  for (const [from, to] of Object.entries(moves)) lines.push(`Run planned for ${from} moved to ${to}.`)
  const extras = readCoachExtras()
  for (const [d, r] of Object.entries(extras.rest)) lines.push(`${d} is a full rest day (${r}).`)
  for (const [d, t] of Object.entries(extras.notes)) lines.push(`Note on ${d}: ${t}`)
  for (const s of Object.values(extras.sessions)) lines.push(`Accepted extra ${s.kind.toLowerCase()} on ${s.date}: ${s.text}`)
  return lines
}
