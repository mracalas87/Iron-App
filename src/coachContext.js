import { RACES, RUN_GUIDE, MILESTONES, currentPhase, weekPlan, daysUntil, getSessions, carryMissed } from './plan'
import { setsByGroup } from './muscleSets'
import { MUSCLE_GROUPS } from './db'

// The summary the in-app coach reads with every question: today, the plan, how recovered Andy is,
// the next 7 days, and the last weeks of lifting, running and health numbers. It is plain text,
// kept short, so a question costs very little.

const dayLabel = (iso) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

// with the year, for dates far enough away that the year matters
const dayLabelY = (iso, today) =>
  iso.slice(0, 4) !== today.slice(0, 4) ? `${dayLabel(iso)} ${iso.slice(0, 4)}` : dayLabel(iso)

const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const pace = (meters, seconds) => {
  if (!meters || !seconds) return '?'
  const p = seconds / (meters / 1000)
  return `${Math.floor(p / 60)}:${String(Math.round(p % 60)).padStart(2, '0')}/km`
}

// today: ISO date. vitals: getVitals() output. workouts: annotated workouts. garminActs: Garmin activities.
export function buildCoachContext({ today, status, level, trend, advice, upcoming, last30, vitals, workouts, loadTypes, volumeOf, garminActs, customRules, rules, coachChanges, goals, categoryOf, loggedRuns }) {
  const L = []

  L.push('TODAY AND GOALS')
  L.push(`Today is ${dayLabel(today)}.`)
  for (const r of RACES) {
    const n = daysUntil(r.date, today)
    if (n >= 0) L.push(`${r.name}: ${dayLabelY(r.date, today)} (${n} days). ${r.pacing}`)
  }
  const cp = currentPhase(today)
  if (cp.state === 'active') L.push(`Phase: ${cp.phase.name}, week ${cp.week} of ${cp.totalWeeks}. ${cp.phase.instruction}`)
  const wk = weekPlan(today)
  if (wk) L.push(`This week (${wk.label}${wk.km ? ', ' + wk.km : ''}): ${wk.sessions.join(' | ')}`)
  if (advice && advice.plan) L.push(`Next step: ${advice.plan}`)

  // The timeframes the week has to fit inside: the next race, every planned run still to come before it,
  // where the phase ends, and any test or checkpoint coming.
  const targetRace = RACES.find((r) => r.date >= today)
  if (targetRace) {
    L.push('')
    L.push('DEADLINES AND WHAT IS STILL PLANNED')
    const short = (t) => t.split(', heart rate')[0].split('. ')[0]
    const left = Object.entries(carryMissed(getSessions(), loggedRuns || [], today).sessions)
      .filter(([d]) => d >= today && d <= targetRace.date)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([d, t]) => `${dayLabel(d)}: ${short(t)}`)
    L.push(`Next race: ${targetRace.name}, ${dayLabel(targetRace.date)}, in ${daysUntil(targetRace.date, today)} days.`)
    L.push(`Planned runs still to come before it: ${left.join(' | ') || 'none'}.`)
    if (cp.state === 'active') {
      L.push(`This phase (${cp.phase.name}) ends ${dayLabel(cp.phase.end)}${cp.next ? `, then ${cp.next.name} from ${dayLabel(cp.next.start)}` : ''}.`)
    }
    for (const m of MILESTONES) {
      const n = daysUntil(m.date, today)
      if (n >= 0 && n <= 90) L.push(`Coming: ${dayLabel(m.date)}, ${m.text} (${n} days).`)
    }
  }

  if (goals) {
    const level = (g) => (g === 'competitive' ? 'COMPETITIVE: chase a time and race it' : 'FUN: enjoy it and finish in a time that suits him, pushing slightly but not racing')
    L.push('')
    L.push('HIS GOALS')
    L.push(`Lisbon marathon: ${level(goals.lisbon)}.`)
    L.push(`Ironman 70.3 Cascais: ${level(goals.cascais)}.`)
    L.push(goals.lifting === 'gain' ? 'Lifting: hold his muscle and try to gain some while doing the endurance training.' : 'Lifting: hold his muscle while doing the endurance training.')
    L.push(
      goals.period === 'busy'
        ? 'Life right now: BUSY, little time. Keep sessions short, protect sleep, cut volume before intensity.'
        : goals.period === 'more'
          ? 'Life right now: MORE TIME than usual (holidays). There is room for extra sessions.'
          : 'Life right now: normal.'
    )
  }

  L.push('')
  L.push('HOW HE IS TODAY')
  if (status && status !== '—') L.push(`Recovery ${status} (${level} of 6). Training ${advice.zone} (${advice.level} of 6). ${advice.headline}`)
  if (trend && trend.level !== 'steady') L.push(`Recovery trend: ${trend.level}. ${trend.summary}`)
  if (advice) {
    if (advice.liftBrief || advice.strength) L.push(`App suggests for lifting: ${advice.liftBrief || advice.strength}`)
    if (advice.run) L.push(`App suggests for running: ${advice.run}`)
    if (advice.tip) L.push(advice.tip)
  }

  L.push('')
  L.push('COMING UP (the app schedule)')
  for (const row of upcoming ? upcoming.rows : []) {
    const parts = [row.lift, ...row.cardio.map((c) => `${c.kind}: ${c.text}`)].filter(Boolean)
    L.push(`${row.label === 'Tomorrow' ? `Tomorrow ${dayLabel(row.date)}` : row.label}: ${parts.join('; ') || 'nothing'}${row.note ? ` (${row.note})` : ''}`)
  }
  if (upcoming && upcoming.liftKnown) {
    L.push(`Lift cycle: done recently ${upcoming.cycle.done.join(', ') || 'none'}; due ${upcoming.cycle.due.join(', ') || 'none'}.`)
  }

  L.push('')
  L.push('LAST 7 DAYS OF HEALTH (date, resting HR, overnight HRV ms, sleep h)')
  const dates = vitals ? vitals.dates.slice(-7) : []
  const tail = (arr) => (arr || []).slice(-dates.length)
  const rhr = tail(vitals && vitals.restingHR.values)
  const hrv = tail(vitals && vitals.hrv.values)
  const sleep = tail(vitals && vitals.sleepHours.values)
  dates.forEach((d, i) => {
    L.push(`${d}: ${rhr[i] ?? '?'}, ${hrv[i] ?? '?'}, ${sleep[i] != null ? Math.round(sleep[i] * 10) / 10 : '?'}`)
  })

  L.push('')
  L.push('LIFTS IN THE LAST 14 DAYS (date, title, type, sets, volume kg)')
  const since = addDays(today, -13)
  const lifts = workouts.filter((w) => w.date >= since).sort((a, b) => (a.date < b.date ? -1 : 1))
  if (lifts.length === 0) L.push('none logged')
  for (const w of lifts) {
    const sets = (w.exercises || []).reduce((s, e) => s + (e.sets || []).length, 0)
    const names = (w.exercises || []).slice(0, 4).map((e) => e.exerciseName).join(', ')
    L.push(`${w.date}: ${w.title}, ${loadTypes.get(w.date) || 'untyped'}, ${sets} sets, ${Math.round(volumeOf(w))} kg${names ? ` (${names})` : ''}`)
  }

  // How his weeks have actually looked, so a change of routine shows: lifting days, which lifts, and
  // how many runs, swims and rides each week (Monday to Sunday), newest last.
  const monday = (iso) => addDays(iso, -((new Date(iso + 'T12:00:00Z').getUTCDay() + 6) % 7))
  const thisMonday = monday(today)
  L.push('')
  L.push('HIS LAST 4 WEEKS (week starting Monday: lifting days and lifts; runs; swims; rides)')
  for (let w = 3; w >= 0; w--) {
    const start = addDays(thisMonday, -7 * w)
    const end = addDays(start, 6)
    const lifted = workouts.filter((x) => x.date >= start && x.date <= end)
    const days = new Set(lifted.map((x) => x.date)).size
    const names = lifted.sort((a, b) => (a.date < b.date ? -1 : 1)).map((x) => x.title).join(', ')
    const acts = (garminActs || []).filter((a) => {
      const d = (a.startTimeLocal || '').slice(0, 10)
      return d >= start && d <= end
    })
    const count = (re) => acts.filter((a) => re.test(a.activityType?.typeKey || ''))
    const runsW = count(/running/)
    const km = runsW.reduce((s, a) => s + a.distance / 1000, 0)
    L.push(`${start}: ${days} lifting days (${names || 'none'}); ${runsW.length} runs ${Math.round(km)} km; ${count(/swim/).length} swims; ${count(/cycl|biking/).length} rides`)
  }
  // Sets for each muscle group per week, and how his heaviest regular lifts are moving, for the muscle goal.
  if (categoryOf) {
    L.push('')
    L.push('SETS PER MUSCLE GROUP PER WEEK (newest week last)')
    const weeksSets = []
    for (let w = 3; w >= 0; w--) {
      const start = addDays(thisMonday, -7 * w)
      weeksSets.push(setsByGroup(workouts, categoryOf, start, addDays(start, 6)))
    }
    for (const g of MUSCLE_GROUPS) L.push(`${g}: ${weeksSets.map((s) => Math.round(s[g] || 0)).join(', ')}`)

    const e1rm = (set) => (set.reps > 0 && set.weight > 0 ? set.weight * (1 + set.reps / 30) : 0)
    const byEx = {}
    for (const w of workouts.filter((x) => x.date >= addDays(today, -56))) {
      for (const ex of w.exercises || []) {
        const best = Math.max(0, ...(ex.sets || []).map(e1rm))
        if (best <= 0) continue
        const rec = (byEx[ex.exerciseName] = byEx[ex.exerciseName] || [])
        rec.push({ date: w.date, best })
      }
    }
    const lines = Object.entries(byEx)
      .filter(([, r]) => r.length >= 3)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([name, r]) => {
        r.sort((a, b) => (a.date < b.date ? -1 : 1))
        return `${name}: estimated one-rep max ${Math.round(r[r.length - 1].best)} kg now, ${Math.round(r[0].best)} kg on ${r[0].date} (${r.length} sessions)`
      })
    if (lines.length) {
      L.push('')
      L.push('HIS MOST REGULAR LIFTS (last 8 weeks)')
      for (const l of lines) L.push(l)
    }
  }

  const sinceGap = addDays(today, -41)
  const gaps = []
  for (const t of [0, 1, 2, 3, 4]) {
    const ds = workouts.filter((x) => x.date >= sinceGap && x.lift && x.lift.tokens && x.lift.tokens[0] === t).map((x) => x.date).sort()
    if (ds.length >= 2) {
      const diffs = ds.slice(1).map((d, i) => Math.round((new Date(d + 'T12:00:00Z') - new Date(ds[i] + 'T12:00:00Z')) / 86400000))
      gaps.push(`${['Shoulders', 'Back', 'Legs', 'Chest', 'Arms'][t]} every ${(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(1)} days (${ds.length} times)`)
    }
  }
  if (gaps.length) L.push('Days between the same lift over 6 weeks: ' + gaps.join('; ') + '.')

  L.push('')
  L.push('RUNS IN THE LAST 28 DAYS FROM GARMIN (date, km, pace, average HR, max HR)')
  const runSince = addDays(today, -27)
  const runs = (garminActs || [])
    .filter((a) => (a.activityType?.typeKey || '').includes('running') && (a.startTimeLocal || '').slice(0, 10) >= runSince)
    .sort((a, b) => ((a.startTimeLocal || '') < (b.startTimeLocal || '') ? -1 : 1))
  if (runs.length === 0) L.push('none')
  for (const a of runs) {
    L.push(`${(a.startTimeLocal || '').slice(0, 10)}: ${(a.distance / 1000).toFixed(1)} km, ${pace(a.distance, a.duration)}, ${a.averageHR ?? '?'}, ${a.maxHR ?? '?'}`)
  }

  if (last30) {
    L.push('')
    L.push(
      `LAST 30 DAYS: ${last30.lifts} lifts logged; run ${last30.runKm} km; swim ${last30.swimKm} km; ride ${last30.rideKm} km. A sport with 0 means none recorded by Garmin.`
    )
  }

  L.push('')
  if (rules) {
    const names = ['Shoulders', 'Back', 'Legs', 'Chest', 'Arms']
    L.push('HIS CURRENT SCHEDULE RULES (he can change these)')
    L.push(
      `Lifts in the rotation: ${rules.activeLifts.map((i) => names[i]).join(', ')}. The same lift not again within ${rules.spacingDays} days. An off day after ${rules.restAfter} lifting days in a row. Legs kept clear ${rules.legsBuffer} days around a run of ${rules.longRunKm} km or more. ${rules.keyRunNoLift ? 'No lifting on a race-rhythm run day.' : 'Lifting is allowed on a race-rhythm run day.'}`
    )
    L.push('')
  }
  if (coachChanges && coachChanges.length) {
    L.push('CHANGES ALREADY MADE (do not repeat them)')
    for (const line of coachChanges) L.push(line)
    L.push('')
  }
  if (customRules && customRules.trim()) {
    L.push('HIS OWN RULES (follow these as part of his rules)')
    L.push(customRules.trim())
    L.push('')
  }
  L.push('HIS RUNNING ZONES')
  for (const z of RUN_GUIDE) L.push(`${z.name}: heart rate ${z.hr}; ${z.pace}`)

  return L.join('\n')
}
