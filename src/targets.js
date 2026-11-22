// The variables that set the target line for a muscle group (Progress tab) and the research session (Lift tab).
//
// Each variable multiplies the number of hard sets in a session. The baseline is the research dose for an intermediate
// lifter under 40 who trains the muscle twice a week, sleeps 7 hours or more and does little running. Where the number can
// be read from your own data (your log, your runs, your Garmin sleep) it is, and the source is shown so you can judge it.
// This is a guide from group averages, not a prescription.

import { listRuns } from './db'
import { EXPERIENCE, ageFactor } from './bodyStats'
import { MIN_REAL_NIGHT } from './trends'

const LEGS = ['Quads', 'Hamstrings']
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const r2 = (n) => Math.round(n * 100) / 100

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// Average sleep over the last 7 recorded nights in the saved Garmin data (nights under 3 h are the watch missing the night).
export function garminSleepAverage() {
  try {
    const cached = JSON.parse(localStorage.getItem('iron-health-cache') || 'null')
    const nights = (cached?.days || [])
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((d) => d.sleep?.dailySleepDTO?.sleepTimeSeconds)
      .filter((s) => typeof s === 'number' && s / 3600 >= MIN_REAL_NIGHT)
      .slice(-7)
      .map((s) => s / 3600)
    return nights.length >= 3 ? nights.reduce((a, b) => a + b, 0) / nights.length : null
  } catch {
    return null
  }
}

// Sessions a week for this muscle over the last 4 weeks, from the logged workouts.
export function sessionsPerWeek(workouts, group) {
  const since = isoDaysAgo(27)
  const n = workouts.filter((w) => w.date >= since && (w.muscleGroups || []).includes(group)).length
  return n / 4
}

// Returns { factor, freq, items: [{ key, label, value, effect, source, note }], keep: [..] }.
// factor = the product of every effect, used as the sets multiplier in research.js.
export async function buildTargets(group, stats, workouts) {
  const items = []

  const exp = EXPERIENCE.find((e) => e.id === stats.experience) || EXPERIENCE[1]
  items.push({
    key: 'experience',
    label: 'Lifting experience',
    value: exp.label,
    effect: exp.sets,
    source: 'you',
    note: 'More trained lifters need more sets for the same progress.'
  })

  items.push({
    key: 'age',
    label: 'Age',
    value: String(stats.age),
    effect: ageFactor(stats.age),
    source: 'you',
    note: 'Recovery between hard sessions slows with age, so the dose is trimmed a little from 40. The evidence is thin.'
  })

  const auto = sessionsPerWeek(workouts, group)
  const freq = stats.sessionsPerWeek || (auto > 0 ? auto : null)
  items.push({
    key: 'frequency',
    label: `${group} sessions a week`,
    value: freq ? `${Math.round(freq * 10) / 10} a week` : 'none in 4 weeks, 2 assumed',
    effect: freq ? r2(clamp(2 / freq, 0.7, 1.4)) : 1,
    source: stats.sessionsPerWeek ? 'you' : 'your log, last 4 weeks',
    note: 'The weekly total of hard sets is what builds the muscle (10 to 20 a week, Schoenfeld 2017). The target splits it across your sessions and stops at 8 (heavy), 10 (mixed) or 12 (volume) a session, since extra sets in one sitting add little. Once a week leaves you short of the weekly range; twice is the usual sweet spot (Schoenfeld 2016).'
  })

  const sleep = garminSleepAverage()
  items.push({
    key: 'sleep',
    label: 'Sleep, last 7 nights',
    value: sleep != null ? `${Math.round(sleep * 10) / 10} h` : 'no Garmin data',
    effect: sleep == null ? 1 : sleep >= 7 ? 1 : sleep >= 6.5 ? 0.95 : 0.9,
    source: sleep != null ? 'Garmin' : '-',
    note: 'Short sleep blunts muscle repair and strength (Lamon 2021), so the target eases when sleep runs under 7 hours.'
  })

  if (LEGS.includes(group)) {
    const runs = await listRuns()
    const km = runs.filter((r) => r.date >= isoDaysAgo(27)).reduce((s, r) => s + r.distanceKm, 0) / 4
    items.push({
      key: 'running',
      label: 'Running, km a week',
      value: `${Math.round(km)} km`,
      effect: km >= 40 ? 0.95 : 1,
      source: 'your runs, last 4 weeks',
      note: 'Heavy endurance training can blunt leg strength gains (Wilson 2012), though later work finds little effect on size (Schumann 2022). So only a small trim, from 40 km a week.'
    })
  }

  const factor = r2(items.reduce((p, i) => p * i.effect, 1))
  return {
    factor,
    freq,
    items,
    keep: [
      'Effort: finish sets 1 to 3 reps short of failure (Refalo 2023).',
      'Rest: 2 to 5 minutes between heavy sets, 60 to 120 seconds between lighter ones (Schoenfeld 2016).',
      'Protein: about 1.6 to 2.2 g per kg of body weight a day (Morton 2018).',
      'Progress: add a rep each session until the top of the range, then add weight and drop back (double progression).',
      'Deload: an easier week every 4 to 8 weeks, or sooner if your recovery trend turns down.'
    ]
  }
}
