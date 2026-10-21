// The next few days: which lift is due, and the run, swim or ride the plan calls for.
//
// Lifts follow the rolling 5-lift cycle (shoulders, back, legs, chest, arms) plus an off
// day with a run. Where you are in the cycle comes from your last logged workout and the
// morning heart-rate blocks since. Your rules are applied on top: nothing that would
// clash with the long run, race, swim or ride gets scheduled, and a lift that cannot go
// on a day is moved to the next day it can, not dropped.
import { currentPhase, monthTarget, RACES, SWIM_RIDE_FROM } from './plan'

const CYCLE = ['Shoulders', 'Back', 'Legs', 'Chest', 'Arms', 'Off']
const OFF = 5
const GROUP_TOKEN = { Shoulders: 0, Back: 1, Quads: 2, Hamstrings: 2, Chest: 3, Biceps: 4, Triceps: 4 }
const EASY_HR = 148

const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const gap = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000)
const dow = (iso) => new Date(iso + 'T12:00:00Z').getUTCDay() // 0 = Sunday
const label = (iso) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

// Highest cycle position among a workout's muscle groups, so "Chest, Triceps" counts as arms.
export function tokenOfGroups(groups) {
  const hits = (groups || []).map((g) => GROUP_TOKEN[g]).filter((t) => t != null)
  return hits.length ? Math.max(...hits) : null
}

// The day for a phase's long run: the first weekend day from `from` that is at least 3 days
// after the last legs session (else the first such day, else `from`).
export function longRunSlot(phase, from, lastLegs) {
  const start = from > phase.start ? from : phase.start
  const days = []
  for (let d = start; d <= phase.end; d = addDays(d, 1)) days.push(d)
  const ok = (d) => !lastLegs || gap(lastLegs, d) >= 3
  const weekend = (d) => dow(d) === 0 || dow(d) === 6
  return days.find((d) => ok(d) && weekend(d)) || days.find(ok) || days[0] || start
}

// "25 to 60 km" -> 60. Used with the "raise the long ride by 10 km at most" rule.
const rangeMax = (text) => {
  const nums = (text || '').match(/\d+/g)
  return nums ? Math.max(...nums.map(Number)) : null
}

function swimText(d) {
  if (d >= '2026-11-24' && d <= '2026-11-30') return '400 m swim baseline test'
  if (d < '2026-11-24') return 'Recovery: easy swim or rest'
  const t = monthTarget(d)
  if (t && t.swim) return `Swim: ${t.swim}`
  return 'Swim session'
}

function rideText(d, lastRideKm) {
  if (d >= '2026-11-28' && d <= '2026-11-30') return '30 km ride baseline test'
  if (d < '2026-11-28') return 'Recovery: easy spin or rest'
  const t = monthTarget(d)
  const max = rangeMax(t && t.ride)
  if (lastRideKm && max && /\bto\b/.test(t.ride)) {
    const cap = Math.min(lastRideKm + 10, max)
    return `Ride up to ${cap} km (last long ride ${Math.round(lastRideKm)} km, plus 10 at most)`
  }
  if (t && t.ride) return `Ride: ${t.ride}`
  return 'Ride session'
}

// today: ISO date. nowHour: local hour, used to tell whether today's lift is still to come.
// weightDates: Set of dates with a morning heart-rate block. rides: [{ date, km }].
export function buildUpcoming({ today, nowHour = 12, workouts, weightDates, runs, rides = [], days = 4 }) {
  const lifted = (d) => weightDates.has(d) || workouts.some((w) => w.date === d)
  const logged = workouts
    .map((w) => ({ date: w.date, token: tokenOfGroups(w.muscleGroups), groups: w.muscleGroups || [] }))
    .filter((w) => w.token != null && w.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = logged[0] && gap(logged[0].date, today) <= 10 ? logged[0] : null
  const lastLegs = logged.find((w) => w.token === 2)
  const lastRideKm = rides.length ? rides.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0].km : null

  // ---- fixed points: the long run, the race, and how legs clash with them ----
  const longDone = (phase) => runs.some((r) => r.date >= phase.start && r.date <= today && r.distanceKm >= phase.run.min)
  const longRuns = new Map() // date -> text
  const legsBlocked = new Map() // date -> reason
  const forcedOff = new Map() // date -> reason (no lift that day)
  const end = addDays(today, days)
  const seenPhases = new Set()
  for (let d = today; d <= end; d = addDays(d, 1)) {
    const cp = currentPhase(d)
    if (cp.state !== 'active' || seenPhases.has(cp.phase.id)) continue
    seenPhases.add(cp.phase.id)
    const ph = cp.phase
    if (ph.run && ph.run.kind === 'long' && !longDone(ph)) {
      const slot = longRunSlot(ph, d, lastLegs ? lastLegs.date : null)
      const cap = ph.run.label[0].toUpperCase() + ph.run.label.slice(1)
      longRuns.set(slot, `${cap} ${ph.run.min}-${ph.run.max} km, easy (heart rate under ${EASY_HR})`)
      forcedOff.set(slot, 'long run day')
      for (let k = 1; k <= 2; k++) legsBlocked.set(addDays(slot, -k), 'long run coming')
      legsBlocked.set(slot, 'long run day')
    }
  }
  for (const race of RACES) {
    if (race.date < today || race.date > addDays(end, 3)) continue
    forcedOff.set(race.date, 'race day')
    forcedOff.set(addDays(race.date, -1), 'day before the race')
    for (let k = 0; k <= 7; k++) legsBlocked.set(addDays(race.date, -k), 'taper: no heavy leg work')
    if (race.kind === 'run') for (let k = 1; k <= 3; k++) legsBlocked.set(addDays(race.date, k), 'recovering from the race')
  }

  const allowed = (token, d) => {
    if (token === OFF) return true
    if (token === 2 && legsBlocked.has(d)) return false
    if (d >= SWIM_RIDE_FROM) {
      const w = dow(d)
      if (w === 1 && [0, 1, 3].includes(token)) return false // swim tomorrow: no chest, back, shoulders
      if (w === 2 && ![2, 4].includes(token)) return false // swim tonight: legs or arms only
      if ([4, 5, 6].includes(w) && token === 2) return false // Saturday ride: no legs Thu to Sat
    }
    return true
  }
  const whyBlocked = (token, d) => {
    if (token === 2 && legsBlocked.has(d)) return legsBlocked.get(d)
    const w = dow(d)
    if (w === 1) return 'swim tomorrow'
    if (w === 2) return 'swim tonight'
    return 'Saturday ride'
  }

  // ---- where the rolling cycle stands ----
  const known = !!last
  let queue = []
  if (known) {
    for (let i = 1; i <= 6; i++) queue.push((last.token + i) % 6)
  }
  let todayToken = null
  const refill = () => {
    while (queue.length < 8) queue.push(((queue[queue.length - 1] ?? 4) + 1) % 6)
  }
  const consume = (token) => {
    const i = queue.indexOf(token)
    if (i >= 0) queue.splice(i, 1)
    refill()
  }
  if (known) {
    // days since the last logged lift
    for (let d = addDays(last.date, 1); d <= today; d = addDays(d, 1)) {
      const loggedOn = logged.find((w) => w.date === d)
      const pendingToday = d === today && !lifted(d) && nowHour < 10
      if (loggedOn) consume(loggedOn.token)
      else if (lifted(d)) {
        if (queue[0] === OFF) queue.shift()
        consume(queue.find((t) => t !== OFF))
      } else if (pendingToday) {
        const pick = queue.find((t) => allowed(t, d))
        if (pick != null) {
          todayToken = pick
          consume(pick)
        }
      } else if (queue[0] === OFF) queue.shift()
      refill()
    }
  }

  const legsName = () => {
    const g = lastLegs ? lastLegs.groups : []
    if (g.includes('Quads') && !g.includes('Hamstrings')) return 'Legs (hamstring-dominant)'
    if (g.includes('Hamstrings') && !g.includes('Quads')) return 'Legs (quad-dominant)'
    return 'Legs'
  }
  const todayLift = todayToken == null || todayToken === OFF ? (todayToken === OFF ? 'Off day' : null) : todayToken === 2 ? legsName() : CYCLE[todayToken]

  const rows = []
  for (let n = 1; n <= days; n++) {
    const d = addDays(today, n)
    const row = { date: d, label: n === 1 ? 'Tomorrow' : label(d), lift: null, cardio: [], note: null }
    let off = false

    if (forcedOff.has(d)) {
      off = true
      row.lift = 'No lifting'
      row.note = forcedOff.get(d)
      if (queue[0] === OFF) queue.shift()
    } else if (known) {
      const idx = queue.findIndex((t) => allowed(t, d))
      const token = idx >= 0 ? queue[idx] : OFF
      if (idx > 0) row.note = `${CYCLE[queue[0]]} moved (${whyBlocked(queue[0], d)})`
      if (idx >= 0) queue.splice(idx, 1)
      refill()
      if (token === OFF) {
        off = true
        row.lift = 'Off day'
      } else {
        row.lift = CYCLE[token]
        if (token === 2) {
          const g = lastLegs ? lastLegs.groups : []
          if (g.includes('Quads') && !g.includes('Hamstrings')) row.lift = 'Legs (hamstring-dominant)'
          else if (g.includes('Hamstrings') && !g.includes('Quads')) row.lift = 'Legs (quad-dominant)'
        }
      }
    }

    // ---- the run, swim or ride ----
    const cp = currentPhase(d)
    const race = RACES.find((r) => r.date === d)
    if (race) {
      row.cardio.push({ kind: race.kind === 'run' ? 'Run' : 'Race', text: `${race.name}. ${race.pacing.split('. ')[0]}` })
    } else if (cp.state === 'active') {
      const ph = cp.phase
      if (longRuns.has(d)) row.cardio.push({ kind: 'Run', text: longRuns.get(d) })
      else if (ph.run && ph.run.kind === 'cap' && off && !forcedOff.has(d)) {
        row.cardio.push({ kind: 'Run', text: `Easy run, up to ${ph.run.max} km` })
      } else if (ph.run && ph.run.kind !== 'cap' && off && !forcedOff.has(d)) {
        row.cardio.push({ kind: 'Run', text: `Easy run, heart rate under ${EASY_HR}` })
      }
      if (d >= SWIM_RIDE_FROM) {
        const w = dow(d)
        if (w === 2) row.cardio.push({ kind: 'Swim', text: `${swimText(d)}, 5-6pm` })
        else if (w === 6) row.cardio.push({ kind: 'Ride', text: rideText(d, lastRideKm) })
        else if (off && !longRuns.has(d)) row.cardio.push({ kind: 'Run', text: `Easy run, heart rate under ${EASY_HR}` })
      }
    }
    rows.push(row)
  }

  return { rows, todayLift, liftKnown: known, lastLogged: last ? { date: last.date, name: CYCLE[last.token] } : null }
}
