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
export function buildAdvice({ hasHealth, statusPoints, sleepLastNight, workouts, runs, muscleGroups, daysAgo, now = new Date() }) {
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
  const noRestWeek = Array.from({ length: 7 }, (_, i) => daysAgo(i + 1)).every((d) => activeDays.has(d))
  if (noRestWeek) {
    readiness += 1
    reasons.push('No full rest day in the last 7 days')
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

  const tip = readiness >= 3 ? 'An earlier night will do more for you than an extra session.' : null

  if (activeDays.has(today)) {
    return { zone, position, headline: 'Already trained today. Recover well tonight.', strength: null, run: null, tip, reasons }
  }

  const headline = {
    Go: 'Green light. Train as you normally would.',
    Easy: 'Train, but keep it easy today.',
    Rest: 'Rest or very light movement today.'
  }[zone]

  const strength = {
    Go: `Fine.${freshText}${fitText}`,
    Easy: `Moderate loads, stop a rep or two short of failure.${freshText}${fitText}`,
    Rest: 'Skip it, or 15-20 minutes of mobility.'
  }[zone]

  let run
  if (zone === 'Rest') run = 'Skip it, or an easy walk.'
  else if (longRunYesterday) run = zone === 'Go' ? 'Long run yesterday, so keep it easy or lift instead.' : 'Long run yesterday, so skip it or a short easy jog.'
  else run = zone === 'Go' ? 'A normal session is fine.' : 'Easy conversational pace, shorter than usual.'

  return { zone, position, headline, strength, run, tip, reasons }
}
