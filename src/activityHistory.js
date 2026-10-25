// Swims and rides come only from Garmin, and Garmin sends the most recent 60 activities at a time.
// Each time the app has a fresh response it folds them into a small history on the phone (id, date,
// kind, distance), so the last 30 days stay right even as older activities drop out of the response.
// Runs are not kept here: they are saved in the app's own run log (db.js).

const KEY = 'iron-garmin-activities'
const KEEP_DAYS = 120

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const kindOf = (typeKey) => {
  if (/swim/.test(typeKey)) return 'swim'
  if (/cycl|biking/.test(typeKey)) return 'ride'
  return null
}

// health = the cached Garmin response ({ activities: [...] }). Returns [{ id, date, kind, km }].
export function mergeActivities(health) {
  const store = read()
  for (const a of health?.activities || []) {
    const kind = kindOf(a.activityType?.typeKey || '')
    const date = (a.startTimeLocal || '').slice(0, 10)
    if (!kind || !date || !a.distance) continue
    store[String(a.activityId ?? `${date}-${kind}-${Math.round(a.distance)}`)] = { date, kind, km: a.distance / 1000 }
  }
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS)
  const cut = new Date(cutoff.getTime() - cutoff.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  for (const id of Object.keys(store)) if (store[id].date < cut) delete store[id]
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // storage full or blocked: the totals still work from this response
  }
  return Object.entries(store).map(([id, v]) => ({ id, ...v }))
}
