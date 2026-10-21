// Recovery trends from the daily Garmin readings: resting heart rate, overnight HRV and sleep.
//
// A single bad night means little. What matters is a run of days off your own normal, so each
// signal compares the latest days with a personal baseline (the median of the earlier days) and
// counts how long it has lasted. Resting HR rising together with HRV falling is the classic sign
// of fatigue building up (or an illness starting), so that pairing counts for more
// (Plews 2013; Buchheit 2014; Meeusen 2013 overtraining consensus). This is a training guide, not
// medical advice.

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const median = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const sd = (a) => {
  if (a.length < 4) return 0
  const m = mean(a)
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1))
}

// How many of the newest readings in a row meet `bad` (missing readings are skipped).
function streakOf(values, bad) {
  let n = 0
  for (let i = values.length - 1; i >= 0; i--) {
    if (bad(values[i])) n++
    else break
  }
  return n
}

const MIN_BASELINE = 6 // readings needed before resting HR / HRV signals mean anything
const SLEEP_NEED = 7.5

// series: [{ date, rhr, hrv, sleep }] oldest first. Returns
// { level: 'steady' | 'watch' | 'concern' | 'alert', points, signals: [{ key, points, text }], summary, baselineDays }
export function analyzeTrends(series) {
  const column = (key) => series.map((d) => d[key]).filter((x) => x != null)
  const signals = []

  // ---- resting heart rate: up on your normal for several days ----
  const rhr = column('rhr')
  const rhrBase = rhr.slice(-31, -3)
  if (rhrBase.length >= MIN_BASELINE) {
    const base = median(rhrBase)
    const thr = Math.max(3, sd(rhrBase))
    const n = streakOf(rhr, (v) => v - base >= thr)
    if (n >= 2) {
      const up = Math.round(mean(rhr.slice(-n)) - base)
      signals.push({ key: 'rhr', points: n >= 4 ? 2 : 1, text: `Resting HR up ${up} bpm for ${n} days` })
    }
  }

  // ---- HRV: below your normal for several days, or a week-long slide ----
  const hrv = column('hrv')
  const hrvBase = hrv.slice(-31, -3)
  if (hrvBase.length >= MIN_BASELINE) {
    const base = median(hrvBase)
    const thr = Math.max(0.12 * base, sd(hrvBase))
    const n = streakOf(hrv, (v) => base - v >= thr)
    if (n >= 3) {
      const down = Math.round(((base - mean(hrv.slice(-n))) / base) * 100)
      signals.push({ key: 'hrv', points: n >= 5 ? 2 : 1, text: `HRV ${down}% below normal for ${n} days` })
    } else {
      const week = hrv.slice(-7)
      if (week.length >= 5 && mean(week) <= base - Math.max(0.08 * base, 0.75 * sd(hrvBase))) {
        const down = Math.round(((base - mean(week)) / base) * 100)
        signals.push({ key: 'hrv', points: 1, text: `HRV averaging ${down}% below normal this week` })
      }
    }
  }

  // ---- sleep: short nights piling up ----
  const sleep = column('sleep')
  const recent = sleep.slice(-5)
  const short = recent.filter((v) => v < 6.5).length
  const debt = sleep.slice(-7).reduce((s, v) => s + Math.max(0, SLEEP_NEED - v), 0)
  if (sleep.length >= 5 && debt >= 6) {
    signals.push({ key: 'sleep', points: 2, text: `About ${Math.round(debt)}h of sleep debt this week` })
  } else if (short >= 3) {
    signals.push({ key: 'sleep', points: 1, text: `${short} of the last 5 nights under 6.5h` })
  }

  // ---- resting HR up and HRV down together ----
  const both = signals.some((s) => s.key === 'rhr') && signals.some((s) => s.key === 'hrv')
  let points = signals.reduce((s, x) => s + x.points, 0)
  if (both) {
    points += 1
    signals.push({ key: 'combo', points: 1, text: 'Resting HR up and HRV down together' })
  }

  const level = points === 0 ? 'steady' : points === 1 ? 'watch' : points <= 4 ? 'concern' : 'alert'
  const action = {
    watch: 'Trimming lifting volume.',
    concern: 'Easing lifting and runs.',
    alert: 'Rest day recommended.'
  }[level]
  const summary = level === 'steady' ? 'Recovery trend steady.' : `${signals.filter((s) => s.key !== 'combo').slice(0, 2).map((s) => s.text).join('; ')}. ${action}`
  return { level, points, signals, summary, baselineDays: Math.max(rhrBase.length, hrvBase.length) }
}

export const trendNote = (level) =>
  ({
    watch: 'Recovery is slipping: keep the weights, trim sets by about a third.',
    concern: 'Recovery trend is down: cut sets about 40% and stop 2 reps short of failure.',
    alert: 'Recovery trend is poor: skip lifting today, or 15-20 minutes of mobility.'
  })[level] || null
