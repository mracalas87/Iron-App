import { currentPhase, liftRuleFor } from './plan'
import { longRunSlot } from './upcoming'
import { trendNote } from './trends'

export const ADVICE_ZONES = [
  { key: 'Rest', color: 'var(--danger)' },
  { key: 'Easy', color: 'var(--warn)' },
  { key: 'Go', color: 'var(--pr)' }
]

// Marker position (% along the bar) for 0..7+ readiness points. Go is right, Rest is left.
const POSITIONS = [90, 80, 70, 58, 44, 24, 14, 6]

const r1 = (n) => Math.round(n * 10) / 10
const isoAdd = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const isoGap = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000)
const dayName = (iso) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const firstSentence = (s) => (s || '').split(/(?<=\.)\s/)[0].replace(/\.$/, '')

// What the training plan says for today, before health and lifting adjust it. The long run
// is placed on a weekend day (or the first day) that is at least 3 days after the last legs session.
function planInfo(today, runs, workouts, race) {
  const cp = currentPhase(today)
  if (cp.state !== 'active') return null
  const phase = cp.phase
  const info = { phase, line: null, runKind: null, slot: null, done: null, run: phase.run || null }
  const legsDates = workouts
    .filter((w) => (w.muscleGroups || []).some((g) => g === 'Quads' || g === 'Hamstrings'))
    .map((w) => w.date)
    .sort()
  const lastLegs = legsDates.length ? legsDates[legsDates.length - 1] : null

  if (race && race.date === today && race.pacing) {
    info.line = `Race day: ${race.name}. ${firstSentence(race.pacing)}.`
    info.runKind = 'race'
    return info
  }

  if (phase.run && phase.run.kind === 'long') {
    const { min, max, label } = phase.run
    const cap = label[0].toUpperCase() + label.slice(1)
    info.done =
      runs
        .filter((r) => r.date >= phase.start && r.date <= today && r.distanceKm >= min)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null
    if (info.done) {
      info.runKind = 'long-done'
      info.line = `${cap} done (${r1(info.done.distanceKm)} km, ${dayName(info.done.date)}). Keep the rest easy.`
    } else {
      info.slot = longRunSlot(phase, today, lastLegs)
      info.runKind = 'long-due'
      info.line = `${cap} ${min}-${max} km, easy, by ${dayName(phase.end)}. Best slot: ${info.slot === today ? 'today' : dayName(info.slot)}.`
    }
  } else if (phase.run && phase.run.kind === 'cap') {
    info.runKind = 'cap'
    info.line = `Race week: runs of ${phase.run.max} km at most, all easy.`
  } else {
    info.runKind = 'easy'
    info.line = `${phase.name}: ${firstSentence(phase.instruction)}.`
  }
  return info
}

// Tuned for someone who has trained daily for years and works long weekdays: a
// mild recovery flag still allows training, and it takes several stacked
// signals (poor sleep, raised resting HR, low HRV, no rest day) to say Rest.
// Heart-rate lines from Andy's measured zones: top of easy running (aerobic threshold) and the
// start of threshold/hard running, in bpm.
const EASY_HR_CAP = 148
export const HARD_HR_FROM = 160

// weightDates: dates with an inferred morning weights session (see weights.js).
// weightsToday: that session if there is one today, so a morning lift does not
// count as "already trained" and block advice for an evening run.
export function buildAdvice({
  hasHealth,
  statusPoints,
  sleepLastNight,
  workouts,
  runs,
  muscleGroups,
  daysAgo,
  weightDates = new Set(),
  weightsToday = null,
  loadTypes = new Map(), // date -> 'Heavy' | 'Volume' | 'Mixed' for logged lifting days (loadType.js)
  trend = null, // multi-day recovery trend from trends.js: { level: 'steady' | 'watch' | 'concern' | 'alert' }
  dueLift = null, // today's lift from the cycle, e.g. 'Chest · heavy' or 'Off day' (upcoming.js)
  hardRun = null, // a recorded run in the last two days that was hard: { date, avgHR }
  historyStart = null, // earliest date this phone has any run or activity data for
  race = null, // { name, date }
  now = new Date()
}) {
  const today = daysAgo(0)
  const plan = planInfo(today, runs, workouts, race)

  if (!hasHealth) {
    return {
      zone: null,
      position: null,
      headline: 'Tap Refresh to load your Garmin data and get advice.',
      plan: plan ? plan.line : null,
      strength: null,
      run: null,
      tip: null,
      reasons: []
    }
  }

  const yesterday = daysAgo(1)
  const groupsSince = daysAgo(2)
  const reasons = []
  let readiness = statusPoints

  if (sleepLastNight != null && sleepLastNight < 5.5) {
    readiness += 2
    reasons.push(`Only ${r1(sleepLastNight)}h sleep last night`)
  } else if (sleepLastNight != null && sleepLastNight < 6.5) {
    readiness += 1
    reasons.push(`${r1(sleepLastNight)}h sleep last night`)
  }

  const activeDays = new Set([...workouts.map((w) => w.date), ...runs.map((r) => r.date)])
  const trainedDays = new Set([...activeDays, ...weightDates])
  // He lifts most mornings, so a quiet week is normal; only a full fortnight with no rest counts.
  const noRestFortnight = Array.from({ length: 14 }, (_, i) => daysAgo(i + 1)).every((d) => trainedDays.has(d))
  if (noRestFortnight) {
    readiness += 1
    reasons.push('No full rest day in the last 14 days')
  }

  // One week of running well above the previous three is the clearest simple injury-risk flag
  // (workload ratio above about 1.5, Gabbett 2016). It only means something with four weeks of history.
  const kmBetween = (from, to) =>
    runs.filter((r) => r.date >= daysAgo(from) && r.date <= daysAgo(to)).reduce((s, r) => s + r.distanceKm, 0)
  const lastWeekKm = kmBetween(6, 0)
  const priorWeeklyKm = (kmBetween(13, 7) + kmBetween(20, 14) + kmBetween(27, 21)) / 3
  if (historyStart && historyStart <= daysAgo(27) && priorWeeklyKm >= 10 && lastWeekKm / priorWeeklyKm > 1.5) {
    readiness += 1
    reasons.push(`Last 7 days of running is ${r1(lastWeekKm / priorWeeklyKm)}x the weekly average of the 3 weeks before`)
  }

  // Several heavy days close together build fatigue even when sleep and HRV look fine.
  const heavyRecent = [0, 1, 2, 3].filter((i) => loadTypes.get(daysAgo(i)) === 'Heavy').length
  if (heavyRecent >= 3) {
    readiness += 1
    reasons.push(`${heavyRecent} heavy lifting days in the last 4`)
  }

  // A recovery trend that has held for days is not cancelled by one good night: it sets a floor.
  const level = trend ? trend.level : 'steady'
  if (level === 'concern') readiness = Math.max(readiness, 3)
  else if (level === 'alert') readiness = Math.max(readiness, 5)

  const zone = readiness <= 2 ? 'Go' : readiness <= 4 ? 'Easy' : 'Rest'
  const position = POSITIONS[Math.min(readiness, POSITIONS.length - 1)]

  const yesterdayRuns = runs.filter((r) => r.date === yesterday)
  const yesterdayKm = yesterdayRuns.reduce((s, r) => s + r.distanceKm, 0)
  const yesterdayMin = yesterdayRuns.reduce((s, r) => s + r.durationMin, 0)
  const longRunYesterday = yesterdayKm >= 15 || yesterdayMin >= 90

  const recentGroups = new Set(workouts.filter((w) => w.date >= groupsSince).flatMap((w) => w.muscleGroups || []))
  const fresh = muscleGroups.filter((g) => !recentGroups.has(g))
  const freshText = fresh.length > 0 && fresh.length < muscleGroups.length ? ` Fresh: ${fresh.slice(0, 3).join(', ')}.` : ''

  const dow = now.getDay()
  const workDay = dow >= 1 && dow <= 5
  const fitText = workDay ? ' A 30-45 minute session fits a work day.' : ''

  let tip = readiness >= 3 ? 'An earlier night will do more for you than an extra session.' : null
  // Taper: 8-14 days, volume cut about 40-60%, intensity kept (Bosquet 2007 meta-analysis).
  const daysToRace = race ? Math.round((new Date(race.date + 'T12:00:00Z') - new Date(today + 'T12:00:00Z')) / 86400000) : null
  if (level === 'concern' || level === 'alert') {
    tip = 'Your recovery numbers have been off for several days. Sleep fixes this fastest. If you feel unwell, or it lasts over a week, see a doctor.'
  }
  if (daysToRace != null && daysToRace >= 0 && daysToRace <= 14) {
    const load = race.kind === 'triathlon' ? 'weekly training' : 'weekly running'
    tip = `Taper, ${daysToRace} days to the ${race.name}: cut ${load} by about 40-60%, keep a few short efforts at race pace, and skip new or heavy leg work.`
  }

  // A recorded run today means the day's session is done. A morning lift does not: it can be
  // an inferred heart-rate block or a workout logged in the Log tab, and either way an
  // easy run later can still be advised.
  if (runs.some((r) => r.date === today)) {
    return { zone, position, headline: 'Already trained today. Recover well tonight.', plan: plan ? plan.line : null, strength: null, run: null, tip, reasons }
  }
  const loggedToday = workouts.find((w) => w.date === today) || null
  const liftedToday = weightsToday || loggedToday

  const headline = liftedToday
    ? {
        Go: 'Lifted today. An easy run later is fine.',
        Easy: 'Lifted today. Keep anything else easy.',
        Rest: 'Lifted today. Rest for the rest of the day.'
      }[zone]
    : {
        Go: 'Green light. Train as you normally would.',
        Easy: 'Train, but keep it easy today.',
        Rest: 'Rest or very light movement today.'
      }[zone]

  const liftRule = !liftedToday && zone !== 'Rest' ? liftRuleFor(today) : null
  const offDay = dueLift === 'Off day'
  const liftNote = !liftedToday && !offDay && zone !== 'Rest' && plan && plan.phase.liftNote ? plan.phase.liftNote : null
  const legsNote =
    !liftedToday && zone !== 'Rest' && dueLift && dueLift.startsWith('Legs') && plan && plan.phase.legsNote ? plan.phase.legsNote : null
  // "Chest · heavy" reads as "Chest day, heavy."
  const [dueName, dueStyle] = dueLift ? dueLift.split(' · ') : []
  const dueText =
    !liftedToday && zone !== 'Rest' && dueLift ? (offDay ? 'Off day, no lifting.' : `${dueName} day${dueStyle ? `, ${dueStyle}` : ''}.`) : null
  const strengthBase = liftedToday
    ? loggedToday
      ? `Done today (${loggedToday.title}${loadTypes.get(today) ? `, ${loadTypes.get(today).toLowerCase()} day` : ''}).`
      : `Done this morning (${weightsToday.hotMin} min of raised heart rate, peak ${weightsToday.peak} bpm).`
    : {
        Go: `Fine.${freshText}${fitText}`,
        Easy: `Moderate loads, stop a rep or two short of failure.${freshText}${fitText}`,
        Rest: 'Skip it, or 15-20 minutes of mobility.'
      }[zone]
  // The plan rule: when recovery drifts, shorten lifting first (before cutting runs).
  const driftNote = !liftedToday && !offDay && zone !== 'Rest' ? trendNote(level) : null
  const strength = [dueText, liftRule && `${liftRule}.`, driftNote, liftNote, legsNote, strengthBase].filter(Boolean).join(' ')
  // The short version for Home: today's lift and the one note that matters most.
  const liftBrief = [dueText, driftNote || legsNote || liftNote].filter(Boolean).join(' ') || null

  // Which muscles were trained comes from the muscle groups chosen when each workout was logged.
  const legsOn = (date) => workouts.some((w) => w.date === date && (w.muscleGroups || []).some((g) => g === 'Quads' || g === 'Hamstrings'))
  const legsToday = legsOn(today)
  const legsYesterday = legsOn(yesterday)
  const legsLabel = (date) => {
    const t = loadTypes.get(date)
    return t === 'Heavy' ? 'Heavy legs' : t === 'Volume' ? 'High-volume legs' : 'Legs'
  }
  if (legsYesterday) reasons.push(`${legsLabel(yesterday)} yesterday`)
  // Hard sessions are normally followed by an easy day (hard/easy spacing; a training convention).
  const hardRunYesterday = hardRun && hardRun.date === yesterday
  if (hardRunYesterday) reasons.push(`Hard run yesterday (average ${hardRun.avgHR} bpm)`)

  // The plan sets today's run; health and lifting only ever make it easier or move it.
  let planRun = null
  if (plan) {
    if (plan.runKind === 'long-due') {
      const { min, max } = plan.run
      if (plan.slot === today && zone === 'Go') planRun = `Long run today: ${min}-${max} km, easy, heart rate under ${EASY_HR_CAP}.`
      else if (plan.slot === today)
        planRun = `Long run is due: go only if you feel good, keep it near ${min} km under ${EASY_HR_CAP} bpm, otherwise move it a day.`
      else planRun = `Short easy run at most, so your legs are fresh for the long run on ${dayName(plan.slot)}.`
    } else if (plan.runKind === 'long-done') planRun = `Easy and short, heart rate under ${EASY_HR_CAP}.`
    else if (plan.runKind === 'cap') planRun = `Easy, no more than ${plan.run.max} km.`
    else if (plan.runKind === 'race') planRun = plan.line
    else planRun = `Easy only, heart rate under ${EASY_HR_CAP}. 80% of training stays easy.`
  }

  let run
  if (zone === 'Rest') run = 'Skip it, or an easy walk.'
  else if (level === 'concern' && plan?.runKind !== 'race' && !(plan?.runKind === 'long-due' && plan.slot === today)) run = `Recovery trend is down: easy and short, heart rate under ${EASY_HR_CAP}, or skip it.`
  else if (longRunYesterday) run = zone === 'Go' ? 'Long run yesterday, so keep it easy or lift instead.' : 'Long run yesterday, so skip it or a short easy jog.'
  else if (hardRunYesterday) run = `Hard run yesterday, so keep today easy, heart rate under ${EASY_HR_CAP}.`
  else if (legsToday) run = `${legsLabel(today)} done today, so keep any run short and very easy, heart rate under ${EASY_HR_CAP}, or skip it.`
  else if (legsYesterday) run = `${legsLabel(yesterday)} were yesterday, so keep it easy and flat, heart rate under ${EASY_HR_CAP}, and leave hard efforts for another day.`
  else if (planRun) run = planRun
  else if (zone === 'Go') run = liftedToday ? `Easy to steady is fine. Finish 2-3 hours before bed.` : 'A normal session is fine.'
  else run = `Easy conversational pace, shorter than usual, heart rate under ${EASY_HR_CAP}.`

  return { zone, position, headline, plan: plan ? plan.line : null, strength, liftBrief, run, tip, reasons }
}
