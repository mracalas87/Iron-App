// Garmin sends only 14 days of heart-rate detail, which is too short to know your normal training load. Each time the app has
// a fresh response it works out the daily load for those days (readiness.js) and folds the numbers into a small history on the
// phone (one number a day, up to 120 days), so the 4-week average gets better the longer the app is used.

const KEY = 'iron-load-history'
const KEEP_DAYS = 120

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// computed: Map(date -> { total }) for the days just worked out. Returns the whole history as { date: load }.
export function mergeLoads(computed) {
  const store = read()
  for (const [date, row] of computed) store[date] = Math.round(row.total)
  const dates = Object.keys(store).sort()
  for (const date of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete store[date]
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // storage full or blocked: the numbers still work from this response
  }
  return store
}
