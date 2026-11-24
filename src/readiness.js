// Recovery and training readiness from Garmin data and your lifting, replacing the old warning-points score.
//
// RECOVERY (how recovered the body is this morning, 0 to 100) compares each overnight signal with your own normal, so 70
// means "as usual" and the score drops as the signals fall below it:
//   HRV (35%)            the last night and the median of the last 5, against your 5-week normal
//   Resting HR (20%)     today and the last 3 days, against your normal (a rise is a fall in score)
//   Sleep (30%)          hours against 7.5, the share of deep and REM sleep, time awake, and the last 3 nights' debt
//   Body battery (15%)   how much Garmin says you recharged overnight, against your normal
// A night under 3 hours is the watch missing the night, so it and its HRV are ignored. Garmin's own HRV label only
// subtracts points for Low or Poor, since Unbalanced is a 7-day average that one odd night or a race can tip.
//
// TRAINING READINESS (what to do today) is the recovery score less the strain of your recent training. Strain comes from the
// training load of the last 28 days: each recorded run, ride and swim by heart rate (Banister TRIMP), each morning weights
// session by its heart-rate block plus the sets you logged for it (more for legs and heavy days), so a day you lifted
// counts even when the watch was off, and a block with no log counts from its length. Acute load (7 days) over chronic
// (28 days) above about 1.15 costs points (Gabbett 2016), a very hard day yesterday costs a few more, and a clearly
// lighter week than usual adds a few. Not medical advice.

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const median = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const r1 = (n) => Math.round(n * 10) / 10

export const HR_MAX = 184
export const MIN_REAL_NIGHT = 3
export const SLEEP_NEED = 7.5

// ---------------------------------------------------------------------------------------------- training load

// Banister training impulse: minutes at an intensity, weighted up steeply as heart rate rises toward your maximum.
export function trimp(minutes, hr, rest = 42, max = HR_MAX) {
  const x = clamp((hr - rest) / (max - rest), 0, 1)
  return minutes * x * 0.64 * Math.exp(1.92 * x)
}

export function activityLoad(a, rest = 42) {
  const key = (a.activityType && a.activityType.typeKey) || ''
  const min = (a.duration || 0) / 60
  if (min <= 0) return 0
  let hr = a.averageHR || rest + 0.5 * (HR_MAX - rest)
  if (/swim/.test(key)) hr += 10 // wrist heart rate reads low in the water
  let load = trimp(min, hr, rest)
  if (/strength/.test(key)) load += min * 1.3 // recorded lifting: the muscular work the heart rate misses
  return load
}

// Legs cost the most to recover from, then back; heavy days a little more than the rest.
const groupFactor = (groups = []) => (groups.some((g) => g === 'Quads' || g === 'Hamstrings') ? 1.6 : groups.includes('Back') ? 1.2 : 1)
export function liftLoad(lift) {
  return lift.sets * 3 * groupFactor(lift.groups) * (lift.type === 'Heavy' ? 1.15 : 1)
}

// One morning of weights: the heart-rate blocks (cardiovascular cost) plus the logged lift (muscular cost). A block with no
// log is counted from its length, and a log with no block (watch off) from its sets.
export function weightsLoad(blocks, lifts, rest = 42) {
  let load = 0
  for (const b of blocks) load += trimp(b.hotMin, b.avgHR, rest)
  if (lifts.length) load += lifts.reduce((s, l) => s + liftLoad(l), 0)
  else load += blocks.reduce((s, b) => s + b.hotMin * 1.3, 0)
  return load
}

// Daily training load for each date in [from, to]: Map(date -> { total, cardio, weights }).
//   activities: Garmin activities (startTimeLocal, duration, averageHR, activityType)
//   weightSessions: inferred morning weight blocks [{ date, hotMin, avgHR }]
//   lifts: logged lifts [{ date, sets, groups, type }]
export function dailyLoads({ from, to, activities = [], weightSessions = [], lifts = [], rest = 42 }) {
  const out = new Map()
  const add = (date, part, v) => {
    if (date < from || date > to) return
    const row = out.get(date) || { total: 0, cardio: 0, weights: 0 }
    row[part] += v
    row.total += v
    out.set(date, row)
  }
  const dates = []
  for (let d = from; d <= to; d = isoAdd(d, 1)) dates.push(d)
  for (const d of dates) out.set(d, { total: 0, cardio: 0, weights: 0 })
  for (const a of activities) add((a.startTimeLocal || '').slice(0, 10), /strength/.test((a.activityType && a.activityType.typeKey) || '') ? 'weights' : 'cardio', activityLoad(a, rest))
  for (const d of dates) {
    const blocks = weightSessions.filter((b) => b.date === d)
    const logged = lifts.filter((l) => l.date === d)
    if (blocks.length || logged.length) add(d, 'weights', weightsLoad(blocks, logged, rest))
  }
  return out
}

function isoAdd(iso, n) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Acute (7 day) and chronic (28 day) load from a Map/object of date -> load, up to and including `end` (yesterday, so the
// answer is the same in the morning and in the evening). `yesterday` in the result is the load on `end` itself.
export function loadState(loadByDate, end) {
  const today = end
  const get = (d) => {
    const v = loadByDate instanceof Map ? loadByDate.get(d) : loadByDate[d]
    return v && typeof v === 'object' ? v.total : v
  }
  const dates = []
  for (let i = 27; i >= 0; i--) dates.push(isoAdd(today, -i))
  const known = dates.filter((d) => get(d) != null)
  if (known.length < 7) return { ratio: null, acute: null, chronic: null, yesterday: null, days: known.length }
  const first = known[0]
  const window = dates.filter((d) => d >= first).map((d) => get(d) ?? 0)
  const last7 = window.slice(-7)
  const acute = mean(last7)
  const chronic = mean(window)
  const yesterday = get(end)
  return {
    acute,
    chronic,
    ratio: window.length >= 10 && chronic > 0 ? acute / chronic : null,
    yesterday,
    yesterdayRatio: window.length >= 10 && chronic > 0 && yesterday != null ? yesterday / chronic : null,
    days: window.length
  }
}

export function loadAdjust(state) {
  const parts = []
  let adjust = 0
  if (state.ratio != null) {
    const pen = clamp((state.ratio - 1.15) * 40, 0, 18)
    if (pen > 0) {
      adjust -= pen
      parts.push(`Training load this week is ${r1(state.ratio)}x your 4-week average`)
    } else if (state.ratio < 0.75) adjust += 4
  }
  if (state.yesterdayRatio != null) {
    if (state.yesterdayRatio >= 2.2) {
      adjust -= 9
      parts.push('A very hard day yesterday')
    } else if (state.yesterdayRatio >= 1.6) {
      adjust -= 5
      parts.push('A hard day yesterday')
    }
  }
  return { adjust, reasons: parts }
}

// ---------------------------------------------------------------------------------------------- recovery

// Robust baseline: median and a spread that one odd night cannot inflate (scaled median absolute deviation, with a floor).
function baseline(values, floor) {
  const v = values.filter((x) => x != null)
  if (v.length < 8) return null
  const m = median(v)
  const mad = median(v.map((x) => Math.abs(x - m))) * 1.4826
  return { m, s: Math.max(mad, floor) }
}
const z = (x, b) => (x == null || !b ? null : (x - b.m) / b.s)

// series: [{ date, rhr, hrv, sleep, deep, rem, awake, bb, status }] oldest first (healthHistory.js). Returns
// { score, parts, reasons, now: { hrv, rhr }, normal: { hrv, rhr }, used }.
export function recoveryScore(rawSeries) {
  // a night the watch missed is not sleep: drop it and the HRV from the same recording
  const series = rawSeries.map((d) => (d.sleep != null && d.sleep < MIN_REAL_NIGHT ? { ...d, sleep: null, hrv: null, deep: null, rem: null, awake: null, bb: null } : d))
  if (!series.length) return null
  const last = series.length - 1
  const col = (k) => series.map((d) => d[k])
  const recent = (k, n) => col(k).slice(-n).filter((x) => x != null)
  const base = (k, floor) => baseline(col(k).slice(0, Math.max(0, series.length - 2)).slice(-35), floor)

  const bHrv = base('hrv', 6)
  const bRhr = base('rhr', 2)
  const bBb = base('bb', 8)
  const parts = []
  const reasons = []

  // HRV: the last night and the median of the last 5 (one odd night cannot swing it)
  const hrvNow = col('hrv').slice(-2).filter((x) => x != null).pop() ?? null
  const hrv5 = median(recent('hrv', 5))
  if (bHrv && hrvNow != null && hrv5 != null) {
    const zz = 0.4 * z(hrvNow, bHrv) + 0.6 * z(hrv5, bHrv)
    const score = clamp(70 + 22 * zz, 0, 100)
    parts.push({ key: 'hrv', label: 'HRV', score, weight: 0.35 })
    const pct = Math.round(((hrv5 - bHrv.m) / bHrv.m) * 100)
    if (score < 58) reasons.push(`HRV ${Math.round(hrv5)} ms over the last 5 days, ${Math.abs(pct)}% ${pct < 0 ? 'below' : 'above'} your normal of ${Math.round(bHrv.m)}`)
  }

  // Resting HR: today and the average of the last 3 days
  const rhrNow = col('rhr').slice(-2).filter((x) => x != null).pop() ?? null
  const rhr3 = mean(recent('rhr', 3))
  if (bRhr && rhrNow != null && rhr3 != null) {
    const zz = 0.5 * z(rhrNow, bRhr) + 0.5 * z(rhr3, bRhr)
    const score = clamp(70 - 20 * zz, 0, 100)
    parts.push({ key: 'rhr', label: 'Resting HR', score, weight: 0.2 })
    const d = rhrNow - bRhr.m
    if (score < 58) reasons.push(`Resting heart rate ${Math.round(rhrNow)}, ${Math.round(Math.abs(d))} bpm ${d > 0 ? 'above' : 'below'} your normal of ${Math.round(bRhr.m)}`)
  }

  // Sleep: last recorded night, plus the debt over the last 3
  const nights = col('sleep').map((s, i) => ({ s, i })).filter((x) => x.s != null)
  const lastNight = nights.length && nights[nights.length - 1].i >= last - 1 ? series[nights[nights.length - 1].i] : null
  if (lastNight) {
    const h = lastNight.sleep
    const dur = clamp(((h - 4) / (SLEEP_NEED - 4)) * 100, 0, 100)
    let stage = null
    if (lastNight.deep != null && lastNight.rem != null) stage = clamp((((lastNight.deep + lastNight.rem) / h) / 0.38) * 100, 0, 100)
    const awakePen = lastNight.awake != null ? Math.min(12, (lastNight.awake * 60) / 5) : 0
    let score = (stage != null ? 0.75 * dur + 0.25 * stage : dur) - awakePen
    const last3 = recent('sleep', 3)
    const debt = last3.reduce((s, v) => s + Math.max(0, SLEEP_NEED - v), 0)
    score -= Math.min(18, debt * 4)
    score = clamp(score, 0, 100)
    parts.push({ key: 'sleep', label: 'Sleep', score, weight: 0.3 })
    if (h < 6.5) reasons.push(`Only ${r1(h)} h of sleep last night`)
    else if (debt >= 2.5) reasons.push(`${r1(debt)} h of sleep debt over the last 3 nights`)
    else if (stage != null && stage < 55 && h < 7.5) reasons.push(`Light sleep last night (${Math.round(((lastNight.deep + lastNight.rem) / h) * 100)}% deep and REM)`)
  }

  // Body battery recharged overnight
  const bbNow = col('bb').slice(-2).filter((x) => x != null).pop() ?? null
  if (bBb && bbNow != null) {
    const score = clamp(70 + 18 * z(bbNow, bBb), 0, 100)
    parts.push({ key: 'bb', label: 'Body battery', score, weight: 0.15 })
    if (score < 55) reasons.push(`Body battery recharged only ${Math.round(bbNow)} overnight (normal ${Math.round(bBb.m)})`)
  }

  if (!parts.length) return null
  const wsum = parts.reduce((s, p) => s + p.weight, 0)
  let score = parts.reduce((s, p) => s + p.score * p.weight, 0) / wsum
  // Garmin's own label only counts when it says Low or Poor
  const status = [...series].reverse().map((d) => d.status).find(Boolean)
  if (status === 'LOW' || status === 'POOR') {
    score -= 8
    reasons.push(`Garmin HRV status is ${status.toLowerCase()}`)
  }
  return {
    score: clamp(score, 0, 100),
    parts,
    reasons,
    now: { hrv: hrv5, rhr: rhr3 },
    normal: { hrv: bHrv ? bHrv.m : null, rhr: bRhr ? bRhr.m : null }
  }
}

// Six steps on the bar. Recovery: 1-2 Strained, 3-4 Fair, 5-6 Good. Training: 1 Rest, 2-3 Easy, 4-6 Go.
export const RECOVERY_CUTS = [30, 44, 52, 60, 70] // score needed for level 2, 3, 4, 5, 6
export const READY_CUTS = [40, 48, 56, 64, 72] // readiness needed for level 2..6: 1 Rest, 2-3 Easy, 4-6 Go
export const levelOf = (score, cuts) => 1 + cuts.filter((c) => score >= c).length
export const recoveryWord = (level) => (level <= 2 ? 'Strained' : level <= 4 ? 'Fair' : 'Good')
export const zoneWord = (level) => (level === 1 ? 'Rest' : level <= 3 ? 'Easy' : 'Go')

// Everything together. series: health history rows; loadByDate: Map/object of date -> daily load; today: ISO date.
// trendLevel: 'steady' | 'watch' | 'concern' | 'alert' from trends.js (a trend you can see caps the score).
export function readiness({ series, loadByDate, today, trendLevel = 'steady' }) {
  const rec = recoveryScore(series)
  if (!rec) return null
  let recScore = rec.score
  if (trendLevel === 'concern') recScore = Math.min(recScore, 55)
  else if (trendLevel === 'alert') recScore = Math.min(recScore, 40)
  const load = loadState(loadByDate, isoAdd(today, -1))
  const adj = loadAdjust(load)
  const ready = clamp(recScore + adj.adjust, 0, 100)
  const recLevel = levelOf(recScore, RECOVERY_CUTS)
  const readyLevel = levelOf(ready, READY_CUTS)
  return {
    recovery: { score: Math.round(recScore), level: recLevel, word: recoveryWord(recLevel), parts: rec.parts, now: rec.now, normal: rec.normal },
    training: { score: Math.round(ready), level: readyLevel, zone: zoneWord(readyLevel), load },
    reasons: [...rec.reasons, ...adj.reasons]
  }
}
