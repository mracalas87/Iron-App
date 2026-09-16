import { GarminConnect } from 'garmin-connect'

export const config = { maxDuration: 30 }

const DAYS_BACK = 7
const ACTIVITY_LIMIT = 10

function dateNDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

// Wraps a fetch call so one failing metric doesn't kill the whole sync.
async function safe(fn) {
  try {
    return await fn()
  } catch (err) {
    return { error: err.message }
  }
}

export default async function handler(req, res) {
  const key = req.headers['x-garmin-key']
  if (!process.env.GARMIN_API_KEY || key !== process.env.GARMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const { GARMIN_EMAIL, GARMIN_PASSWORD } = process.env
  if (!GARMIN_EMAIL || !GARMIN_PASSWORD) {
    res.status(500).json({ error: 'Garmin credentials not configured on the server' })
    return
  }

  try {
    const client = new GarminConnect({ username: GARMIN_EMAIL, password: GARMIN_PASSWORD })
    await client.login()

    const activities = await safe(() => client.getActivities(0, ACTIVITY_LIMIT))

    const days = []
    for (let i = 0; i < DAYS_BACK; i++) {
      const date = dateNDaysAgo(i)
      const [sleep, steps, heartRate] = await Promise.all([
        safe(() => client.getSleepData(date)),
        safe(() => client.getSteps(date)),
        safe(() => client.getHeartRate(date))
      ])
      days.push({ date: toDateStr(date), sleep, steps, heartRate })
    }

    res.status(200).json({ fetchedAt: new Date().toISOString(), activities, days })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
