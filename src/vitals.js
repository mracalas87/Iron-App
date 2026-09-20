function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
}

function pick(days, fn) {
  return days.map((d) => {
    const v = fn(d)
    return typeof v === 'number' && !Number.isNaN(v) ? v : null
  })
}

// latest = most recent value; avg = mean of all; delta = last 3 days vs the days before.
function summarize(values) {
  const present = values.filter((v) => v != null)
  if (!present.length) return { values, latest: null, avg: null, delta: null, deltaPct: null }
  const recent = mean(present.slice(-3))
  const earlier = mean(present.slice(0, -3))
  return {
    values,
    latest: present[present.length - 1],
    avg: mean(present),
    delta: earlier != null ? recent - earlier : null,
    deltaPct: earlier ? ((recent - earlier) / earlier) * 100 : null
  }
}

// health = the cached Garmin response ({ days: [...] }, newest first).
export function getVitals(health) {
  const days = (health?.days || []).slice().reverse() // oldest -> newest
  const hours = (fn) => pick(days, (d) => {
    const s = fn(d)
    return typeof s === 'number' ? s / 3600 : null
  })

  const hrvStatus = [...days].reverse().map((d) => d.sleep?.hrvStatus).find(Boolean) || null

  return {
    dates: days.map((d) => d.date),
    hasData: days.length > 0,
    hrvStatus,
    restingHR: summarize(pick(days, (d) => d.heartRate?.restingHeartRate)),
    hrv: summarize(pick(days, (d) => d.sleep?.avgOvernightHrv)),
    sleepHours: summarize(hours((d) => d.sleep?.dailySleepDTO?.sleepTimeSeconds)),
    deepSleepHours: summarize(hours((d) => d.sleep?.dailySleepDTO?.deepSleepSeconds)),
    maxHR: summarize(pick(days, (d) => d.heartRate?.maxHeartRate)),
    steps: summarize(pick(days, (d) => (typeof d.steps === 'number' ? d.steps : null)))
  }
}

// Describes a recent change. `higherIsBetter` decides whether up is green or red.
export function trendLabel(delta, unit, higherIsBetter) {
  if (delta == null) return { text: '', color: 'var(--chalk-dim)' }
  const rounded = Math.round(delta)
  if (rounded === 0) return { text: 'steady', color: 'var(--chalk-dim)' }
  const good = higherIsBetter ? delta > 0 : delta < 0
  return {
    text: `${delta > 0 ? '▲' : '▼'} ${Math.abs(rounded)}${unit ? ' ' + unit : ''}`,
    color: good ? 'var(--pr)' : 'var(--danger)'
  }
}

export function formatHrvStatus(status) {
  if (!status) return null
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function round(n, places = 0) {
  if (n == null) return null
  const f = 10 ** places
  return Math.round(n * f) / f
}
