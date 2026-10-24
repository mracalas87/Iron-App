// Morning weight sessions, inferred from heart rate.
//
// Andy lifts most mornings and does not record it, but it shows as a block of
// raised heart rate: 95+ bpm for 20+ minutes between 04:30 and 10:00 that is not
// part of a recorded activity. Runs are always recorded, so their time (plus a
// recovery allowance that grows with the run) is excluded first, which stops a run
// being counted as weights. A day can have both.
//
// Input samples are [epochMs, bpm] pairs, as returned by /api/garmin in
// days[].hrHigh. Times are read in the phone's local timezone.

const HOT_BPM = 95
const MIN_HOT_MINUTES = 20
const MAX_GAP_MINUTES = 20
const WINDOW_FROM = 4 * 60 + 30
const WINDOW_TO = 10 * 60
const SAMPLE_MINUTES = 2

const minuteOfDay = (ms) => {
  const d = new Date(ms)
  return d.getHours() * 60 + d.getMinutes()
}

// startTimeLocal looks like "2026-10-04 07:22:56". Heart rate stays high for a while after
// an effort, and longer after a long one (a 2 hour run keeps it above 95 for well over an
// hour), so the recovery time after an activity grows with its length: 15 minutes at least,
// three quarters of its duration, 2 hours at most.
function busyWindow(activity) {
  const t = activity.startTimeLocal || ''
  const start = Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16))
  const minutes = Math.ceil((activity.duration || 0) / 60)
  const recovery = Math.min(120, Math.max(15, Math.round(minutes * 0.75)))
  return [start - 5, start + minutes + recovery]
}

export function detectWeights(samples, activitiesThatDay = []) {
  const busy = activitiesThatDay.map(busyWindow)
  const hot = (samples || [])
    .map(([ms, bpm]) => ({ m: minuteOfDay(ms), bpm }))
    .filter(({ m, bpm }) => bpm >= HOT_BPM && m >= WINDOW_FROM && m < WINDOW_TO)
    .filter(({ m }) => !busy.some(([from, to]) => m >= from && m <= to))
    .sort((a, b) => a.m - b.m)

  const blocks = []
  for (const { m, bpm } of hot) {
    const last = blocks[blocks.length - 1]
    if (last && m - last.end <= MAX_GAP_MINUTES) {
      last.end = m
      last.n += 1
      last.sum += bpm
      last.peak = Math.max(last.peak, bpm)
    } else {
      blocks.push({ start: m, end: m, n: 1, sum: bpm, peak: bpm })
    }
  }

  return blocks
    .filter((b) => b.n * SAMPLE_MINUTES >= MIN_HOT_MINUTES)
    .map((b) => ({ start: b.start, end: b.end, hotMin: b.n * SAMPLE_MINUTES, peak: b.peak, avgHR: Math.round(b.sum / b.n) }))
}

// All inferred weight sessions in the cached Garmin response, oldest first.
export function getWeightSessions(health) {
  const activities = health?.activities || []
  const sessions = []
  for (const day of health?.days || []) {
    if (!Array.isArray(day.hrHigh)) continue
    const dayActivities = activities.filter((a) => (a.startTimeLocal || '').slice(0, 10) === day.date)
    for (const s of detectWeights(day.hrHigh, dayActivities)) sessions.push({ ...s, date: day.date })
  }
  return sessions.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
}

// Same sessions, read from the Garmin response the Health tab saved on this phone.
export function readCachedWeightSessions() {
  try {
    return getWeightSessions(JSON.parse(localStorage.getItem('iron-health-cache') || 'null'))
  } catch {
    return []
  }
}

export function clock(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}
