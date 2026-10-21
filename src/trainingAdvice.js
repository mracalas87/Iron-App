export const ADVICE_ZONES = [
  { key: 'Rest', color: 'var(--danger)' },
  { key: 'Easy', color: 'var(--warn)' },
  { key: 'Go', color: 'var(--pr)' }
]

// Marker position (% along the bar) for 0..7+ readiness points. Go is right, Rest is left.
const POSITIONS = [90, 80, 70, 58, 44, 24, 14, 6]

const r1 = (n) => Math.round(n * 10) / 10

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
  hardRun = null, // a recorded run in the last two days that was hard: { date, avgHR }
  historyStart = null, // earliest date this phone has any run or activity data for
  race = null, // { name, date }
  now = new Date()
}) {
  if (!hasHealth) {
    return {
      zone: null,
      position: null,
      headline: 'Refresh your Garmin data on the Health tab to get advice.',
      strength: null,
      run: null,
      tip: null,
      reasons: []
    }
  }

  const today = daysAgo(0)
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
  if (daysToRace != null && daysToRace >= 0 && daysToRace <= 14) {
    const load = race.kind === 'triathlon' ? 'weekly training' : 'weekly running'
    tip = `Taper, ${daysToRace} days to the ${race.name}: cut ${load} by about 40-60%, keep a few short efforts at race pace, and skip new or heavy leg work.`
  }

  // A recorded run today means the day's session is done. A morning lift does not: it can be
  // an inferred heart-rate block or a workout logged in the Log tab, and either way an
  // easy run later can still be advised.
  if (runs.some((r) => r.date === today)) {
    return { zone, position, headline: 'Already trained today. Recover well tonight.', strength: null, run: null, tip, reasons }
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

  const strength = liftedToday
    ? loggedToday
      ? `Done today (${loggedToday.title}${loadTypes.get(today) ? `, ${loadTypes.get(today).toLowerCase()} day` : ''}).`
      : `Done this morning (${weightsToday.hotMin} min of raised heart rate, peak ${weightsToday.peak} bpm).`
    : {
        Go: `Fine.${freshText}${fitText}`,
        Easy: `Moderate loads, stop a rep or two short of failure.${freshText}${fitText}`,
        Rest: 'Skip it, or 15-20 minutes of mobility.'
      }[zone]

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

  let run
  if (zone === 'Rest') run = 'Skip it, or an easy walk.'
  else if (longRunYesterday) run = zone === 'Go' ? 'Long run yesterday, so keep it easy or lift instead.' : 'Long run yesterday, so skip it or a short easy jog.'
  else if (hardRunYesterday) run = `Hard run yesterday, so keep today easy, heart rate under ${EASY_HR_CAP}.`
  else if (legsToday) run = `${legsLabel(today)} done today, so keep any run short and very easy, heart rate under ${EASY_HR_CAP}, or skip it.`
  else if (legsYesterday) run = `${legsLabel(yesterday)} were yesterday, so keep it easy and flat, heart rate under ${EASY_HR_CAP}, and leave hard efforts for another day.`
  else if (zone === 'Go') run = liftedToday ? `Easy to steady is fine. Finish 2-3 hours before bed.` : 'A normal session is fine.'
  else run = `Easy conversational pace, shorter than usual, heart rate under ${EASY_HR_CAP}.`

  return { zone, position, headline, strength, run, tip, reasons }
}
