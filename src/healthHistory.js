// Garmin only sends the last 14 days, which is thin for a personal baseline. Each time the app
// has a fresh response it folds the days into a small history on the phone (a few numbers a day,
// up to 120 days), so baselines get better the longer the app is used.

const KEY = 'iron-health-history'
const KEEP_DAYS = 120

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const num = (x) => (typeof x === 'number' && !Number.isNaN(x) ? x : null)
const hours = (s) => (typeof s === 'number' ? s / 3600 : null)

// health = the cached Garmin response ({ days: [...] }). Returns the merged history,
// oldest first: [{ date, rhr, hrv, sleep, deep }].
export function mergeHealthDays(health) {
  const store = read()
  for (const d of health?.days || []) {
    if (!d?.date) continue
    const row = {
      rhr: num(d.heartRate?.restingHeartRate),
      hrv: num(d.sleep?.avgOvernightHrv),
      sleep: hours(d.sleep?.dailySleepDTO?.sleepTimeSeconds),
      deep: hours(d.sleep?.dailySleepDTO?.deepSleepSeconds)
    }
    // keep what we already knew if today's response is missing a value (the watch has not synced yet)
    const old = store[d.date] || {}
    store[d.date] = {
      rhr: row.rhr ?? old.rhr ?? null,
      hrv: row.hrv ?? old.hrv ?? null,
      sleep: row.sleep ?? old.sleep ?? null,
      deep: row.deep ?? old.deep ?? null
    }
  }
  const dates = Object.keys(store).sort()
  for (const date of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete store[date]
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // storage full or blocked: the trends still work from this response
  }
  return Object.keys(store)
    .sort()
    .map((date) => ({ date, ...store[date] }))
}
