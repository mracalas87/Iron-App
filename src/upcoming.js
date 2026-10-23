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

// The cycle lifts a workout counts for. Biceps or triceps added to another muscle group are
// accessory work, so "Chest, Triceps" ticks off chest only; arms count when they are the
// whole workout.
export function tokensOfGroups(groups) {
  const list = groups || []
  const armsOnly = list.every((g) => g === 'Biceps' || g === 'Triceps')
  const hits = list
    .filter((g) => armsOnly || (g !== 'Biceps' && g !== 'Triceps'))
    .map((g) => GROUP_TOKEN[g])
    .filter((t) => t != null)
  return [...new Set(hits)]
}

// The day for a phase's long run: the first weekend day from `from` that is at least 3 days
// after the last legs session, and at least 4 days after any run of 15 km or more already done
// (else the first such day, else `from`).
export function longRunSlot(phase, from, lastLegs, lastLong = null) {
  const start = from > phase.start ? from : phase.start
  const days = []
  for (let d = start; d <= phase.end; d = addDays(d, 1)) days.push(d)
  const ok = (d) => (!lastLegs || gap(lastLegs, d) >= 3) && (!lastLong || gap(lastLong, d) >= 4)
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
export function buildUpcoming({ today, nowHour = 12, workouts, weightDates, runs, rides = [], loadTypes = new Map(), strain = 'steady', days = 7 }) {
  const lifted = (d) => weightDates.has(d) || workouts.some((w) => w.date === d)
  const logged = workouts
    .map((w) => {
      const tokens = tokensOfGroups(w.muscleGroups)
      return { date: w.date, tokens, token: tokens[0], groups: w.muscleGroups || [] }
    })
    .filter((w) => w.tokens.length > 0 && w.date <= today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  const last = logged[0] && gap(logged[0].date, today) <= 10 ? logged[0] : null
  const lastLegs = logged.find((w) => w.tokens.includes(2))
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
      const doneLong = runs.filter((r) => r.distanceKm >= 15 && r.date <= today).map((r) => r.date).sort().pop() || null
      const slot = longRunSlot(ph, d, lastLegs ? lastLegs.date : null, doneLong)
      const cap = ph.run.label[0].toUpperCase() + ph.run.label.slice(1)
      longRuns.set(slot, `${cap} ${ph.run.min}-${ph.run.max} km, easy (heart rate under ${EASY_HR})`)
      forcedOff.set(slot, 'long run day')
      for (let k = 1; k <= 2; k++) legsBlocked.set(addDays(slot, -k), 'long run coming')
      legsBlocked.set(slot, 'long run day')
      for (let k = 1; k <= 2; k++) legsBlocked.set(addDays(slot, k), 'recovering from the long run')
    }
  }
  for (const race of RACES) {
    if (race.date < today || race.date > addDays(end, 3)) continue
    forcedOff.set(race.date, 'race day')
    forcedOff.set(addDays(race.date, -1), 'day before the race')
    for (let k = 0; k <= 7; k++) legsBlocked.set(addDays(race.date, -k), 'taper: no heavy leg work')
    if (race.kind === 'run') for (let k = 1; k <= 5; k++) legsBlocked.set(addDays(race.date, k), 'recovering from the race')
  }

  // A long run already done in the last 3 days also keeps legs off for the 2 days after it.
  for (const r of runs) {
    if (r.distanceKm >= 15 && r.date <= today && gap(r.date, today) <= 3) {
      for (let k = 1; k <= 2; k++) if (!legsBlocked.has(addDays(r.date, k))) legsBlocked.set(addDays(r.date, k), 'recovering from the long run')
    }
  }

  // A recovery trend that has held for days (trends.js) keeps legs out of the next two days; when it
  // is bad enough, tomorrow is a full rest day.
  const strained = strain === 'concern' || strain === 'alert'
  if (strained) {
    for (const k of [0, 1]) if (!legsBlocked.has(addDays(today, k))) legsBlocked.set(addDays(today, k), 'recovery trend')
    if (strain === 'alert' && !forcedOff.has(addDays(today, 1))) forcedOff.set(addDays(today, 1), 'recovery trend, rest day')
  }

  // When each lift was last done (or scheduled). A lift is not repeated within 5 days, so the same
  // one cannot turn up twice in a week when other lifts are being held back.
  const lastDate = new Map()

  const allowed = (token, d) => {
    if (token === OFF) return true
    if (lastDate.has(token) && gap(lastDate.get(token), d) < 5) return false
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
    if (lastDate.has(token) && gap(lastDate.get(token), d) < 5) return 'done recently'
    const w = dow(d)
    if (w === 1) return 'swim tomorrow'
    if (w === 2) return 'swim tonight'
    return 'Saturday ride'
  }

  // ---- where the cycle stands ----
  // Each lift is ranked by how long since it was last done, oldest first, so a lift taken out of
  // order (chest early, back late) does not confuse what comes next. Days with a heart-rate block
  // but no log are assumed to be whichever lift has gone longest. A lift is not repeated within
  // 5 days, and after 5 lifting days in a row there is an off day.
  const known = !!last
  let todayToken = null
  let cycleDone = []
  let cycleDue = []
  let lastTok = null
  const liftDays = new Set()
  const rank = (t) => (t - ((lastTok ?? -1) + 1) + 5) % 5
  const byOldest = () =>
    [0, 1, 2, 3, 4].sort((x, y) => {
      const a = lastDate.get(x) || '0000'
      const b = lastDate.get(y) || '0000'
      return a < b ? -1 : a > b ? 1 : rank(x) - rank(y)
    })
  const restNeeded = (d) => [1, 2, 3, 4, 5].every((k) => liftDays.has(addDays(d, -k)))
  if (known) {
    const loggedTokens = (d) => [...new Set(logged.filter((w) => w.date === d).flatMap((w) => w.tokens))]
    for (let d = addDays(today, -30); d <= today; d = addDays(d, 1)) {
      let tokens = loggedTokens(d)
      if (!tokens.length && weightDates.has(d)) tokens = [byOldest().find((t) => !lastDate.has(t) || gap(lastDate.get(t), d) >= 5) ?? byOldest()[0]]
      if (tokens.length) {
        liftDays.add(d)
        for (const t of tokens) {
          lastDate.set(t, d)
          lastTok = t
        }
      }
    }
    const fresh = (t) => lastDate.has(t) && gap(lastDate.get(t), today) < 5
    cycleDone = byOldest().filter(fresh).map((t) => CYCLE[t])
    cycleDue = byOldest().filter((t) => !fresh(t)).map((t) => CYCLE[t])
    const pendingToday = !lifted(today) && nowHour < 10
    if (pendingToday) {
      const pick = restNeeded(today) || strain === 'alert' ? undefined : byOldest().find((t) => allowed(t, today))
      todayToken = pick ?? OFF
      if (pick != null) {
        lastDate.set(pick, today)
        lastTok = pick
        liftDays.add(today)
      }
    }
  }

  // The next time a lift comes round it flips between a heavy and a high-volume day, going by
  // how the last one was labelled from its sets and reps.
  const lastStyle = new Map()
  for (const w of logged) {
    for (const t of w.tokens) {
      const type = loadTypes.get(w.date)
      if (!lastStyle.has(t) && (type === 'Heavy' || type === 'Volume')) lastStyle.set(t, type)
    }
  }
  const styleFor = (t) => (lastStyle.get(t) === 'Heavy' ? 'volume' : lastStyle.get(t) === 'Volume' ? 'heavy' : null)
  const liftLabel = (t) => {
    let name = CYCLE[t]
    if (t === 2) {
      const g = lastLegs ? lastLegs.groups : []
      if (g.includes('Quads') && !g.includes('Hamstrings')) name = 'Legs (hamstring-dominant)'
      else if (g.includes('Hamstrings') && !g.includes('Quads')) name = 'Legs (quad-dominant)'
    }
    const style = styleFor(t)
    return style ? `${name} · ${style}` : name
  }

  const todayLift = todayToken == null ? null : todayToken === OFF ? 'Off day' : liftLabel(todayToken)

  const rows = []
  for (let n = 1; n <= days; n++) {
    const d = addDays(today, n)
    const row = { date: d, label: n === 1 ? 'Tomorrow' : label(d), lift: null, cardio: [], note: null }
    let off = false

    if (forcedOff.has(d)) {
      off = true
      row.lift = 'No lifting'
      row.note = forcedOff.get(d)
    } else if (known) {
      // the lift that has gone longest without being done, unless a rule holds it back
      const order = byOldest()
      const pick = restNeeded(d) ? undefined : order.find((t) => allowed(t, d))
      if (pick != null && strained && n === 1) row.note = 'Keep it light (recovery trend)'
      else if (pick != null && pick !== order[0]) row.note = `${CYCLE[order[0]]} moved (${whyBlocked(order[0], d)})`
      if (pick == null) {
        off = true
        row.lift = 'Off day'
      } else {
        row.lift = liftLabel(pick)
        lastDate.set(pick, d)
        lastTok = pick
        liftDays.add(d)
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

  return { rows, todayLift, cycle: { done: cycleDone, due: cycleDue }, liftKnown: known, lastLogged: last ? { date: last.date, name: CYCLE[last.token] } : null }
}
