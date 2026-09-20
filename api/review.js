export const config = { maxDuration: 30 }

const MODEL = 'claude-sonnet-5'
const MAX_BODY_CHARS = 60000

const SYSTEM_PROMPT = `You are reviewing one athlete's recent training and health data from a personal fitness app. The data is JSON with: strength workouts logged in the app, runs (some imported from Garmin, marked by source), other Garmin activities, daily Garmin health metrics (resting heart rate, sleep, steps, HRV where present), and a simple rule-based status.

Notes on the data:
- Garmin "strength" activities and the app's logged workouts are often the same session recorded twice. Do not double count them.
- Some metrics may be missing. Say so rather than guessing.

Write a short review, under 250 words, in plain text with no markdown symbols. Use these four short sections, each starting with its label on its own line:
Overall
Going well
Watch-outs
Next few days

In "Watch-outs", point out possible triggers by relating training load (volume, run distance, back-to-back hard days) to recovery signals (resting heart rate trend, sleep duration and deep sleep, HRV). Be specific and cite the numbers. In "Next few days", give 2-3 concrete, practical suggestions.

You are not a doctor. Do not diagnose. If something looks concerning or persistent, suggest speaking to a doctor or other qualified professional.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' })
    return
  }

  const key = req.headers['x-garmin-key']
  if (!process.env.GARMIN_API_KEY || key !== process.env.GARMIN_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' })
    return
  }

  const summary = req.body && req.body.summary
  if (!summary || typeof summary !== 'object') {
    res.status(400).json({ error: 'Missing summary' })
    return
  }

  const payload = JSON.stringify(summary)
  if (payload.length > MAX_BODY_CHARS) {
    res.status(413).json({ error: 'Summary too large' })
    return
  }

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: payload }]
      })
    })

    const json = await apiRes.json()
    if (!apiRes.ok) {
      res.status(502).json({ error: json?.error?.message || `AI request failed (${apiRes.status})` })
      return
    }

    const review = (json.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    res.status(200).json({ review, generatedAt: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
