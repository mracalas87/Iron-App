// The numbers the VO2 score uses: heart rate limits, the logged interval sessions and the race times.
// Sessions added in the Plan tab are kept on the phone; the baseline below is always there.

export const VO2_PROFILE = {
  restingHr: 42, // lowest typical resting heart rate, Garmin, Nov 2026
  maxHr: 183 // highest heart rate seen in a hard effort (Garmin history)
}

// Baseline 4 x 4 on Sun 22 Nov 2026, from the watch's second-by-second data. The efforts were set by
// distance (about 1 km each), so the time per effort was 4:00 to 4:34.
export const VO2_BASELINE = {
  date: '2026-11-22',
  garmin: 49,
  note: '4 efforts of about 1 km, breaks of 2:46 to 4:42',
  efforts: [
    { distanceM: 1102, seconds: 274, avgHr: 170 },
    { distanceM: 1003, seconds: 239, avgHr: 176 },
    { distanceM: 996, seconds: 249, avgHr: 174 },
    { distanceM: 985, seconds: 244, avgHr: 175 }
  ]
}

// The summer 4 x 4 on Thu 16 Jul 2026 (Garmin showed 48 then): four efforts of about 1 km, the first two
// fast and the third slow. Resting heart rate is taken as the same as now.
export const VO2_SUMMER = {
  date: '2026-07-16',
  garmin: 48,
  note: 'summer 4 x 4: efforts of about 1 km, breaks of 3:45 to 5:35, started fast and slowed on effort 3',
  efforts: [
    { distanceM: 989, seconds: 230, avgHr: 174 },
    { distanceM: 990, seconds: 229, avgHr: 174 },
    { distanceM: 986, seconds: 264, avgHr: 173 },
    { distanceM: 995, seconds: 250, avgHr: 172 }
  ]
}

// All-out race times (not the marathon or half: they were run well under maximum effort).
export const VO2_RACES = [
  { name: '5K', distanceM: 5000, seconds: 21 * 60 + 51 },
  { name: '10K', distanceM: 10000, seconds: 45 * 60 + 45 }
]

const KEY = 'iron-vo2-sessions'

export function readVo2Sessions() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveVo2Session(session) {
  const next = [...readVo2Sessions(), session].sort((a, b) => a.date.localeCompare(b.date))
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked: the session just isn't kept
  }
  return next
}

export function removeVo2Session(date) {
  const next = readVo2Sessions().filter((s) => s.date !== date)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
  return next
}

// One line per hard effort: distance in metres, time as m:ss, average heart rate.
// Example: "1000 4:09 174". Returns { efforts, bad } where bad is the lines that did not parse.
export function parseEfforts(text) {
  const efforts = []
  const bad = []
  for (const raw of String(text).split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^(\d{3,5})\s*m?\s+(\d{1,2}):(\d{2})\s+(\d{2,3})$/)
    if (!m) {
      bad.push(line)
      continue
    }
    const seconds = Number(m[2]) * 60 + Number(m[3])
    const avgHr = Number(m[4])
    if (seconds < 60 || seconds > 1800 || avgHr < 100 || avgHr > 210) {
      bad.push(line)
      continue
    }
    efforts.push({ distanceM: Number(m[1]), seconds, avgHr })
  }
  return { efforts, bad }
}
