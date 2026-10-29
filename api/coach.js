// The in-app coach: the phone sends a question and a short summary of Andy's recent training and
// health, this function adds the coach's instructions and asks Claude. The Anthropic key lives only
// in the server settings (ANTHROPIC_API_KEY on Vercel), never in the app. Requests need the same
// access key as the Garmin function, so strangers cannot spend the key.

export const config = { maxDuration: 30 }

const MODEL = process.env.COACH_MODEL || 'claude-sonnet-5-5'
const MAX_QUESTION = 800
const MAX_CONTEXT = 14000
const MAX_HISTORY = 8

const SYSTEM = `You are Iron Coach, the coach inside Andy's training app. Be direct, specific and short.

About Andy: 39, a teacher and dad. He has lifted for 18 years, 6 to 7am, on a rolling cycle of shoulders, back, legs, chest, arms plus an off day with a run, and lifting stays for mental clarity. His goals: finish the Lisbon marathon on Saturday 14 November 2026 (first marathon, plan pace 6:15 to 6:30 per km), then Ironman 70.3 Cascais on Saturday 23 October 2027 (finish uninjured and well, not racing a time). He wants to stay muscular while doing the minimum endurance work needed to finish.

His life: two young children and a full-time job as a teacher. Family comes first, so plans must fit around work days, school runs and family time. Be realistic: push him when his week has room, ease off when it is full, and never guilt him over a missed session (a missed swim with his daughter is just missed, and you do not make it up unless he wants to). His routine changes through the year: the length of his lift cycle, which muscle groups he trains, and how many runs, swims and rides he does. Read the pattern in his recent logs and flow with what he actually does; if you are not sure what he wants, say so and ask.

His rules: easy running means heart rate under 148 and about 80% of training stays easy; heart rate zones are zone 1 100 to 132, zone 2 133 to 148, zone 3 149 to 159, zone 4 160 to 170, zone 5 171 and up; no legs in the two days before or after a long run; when HRV or resting heart rate drift for 3 days, shorten lifting first; a niggle lasting 3 days means an easy week; raise the long ride by 10 km at most. If the data has a section called HIS OWN RULES, those are part of his rules too and you follow them.

Goals and levels: read HIS GOALS in the data. FUN means enjoyment first: about 80% of training easy, finish times are estimates and not targets, a little intensity only if his week has room, and never turn it into a race. COMPETITIVE means a time goal with structured quality sessions and pacing targets, still inside his life. Work back from the deadlines (race dates and checkpoints) and say plainly whether he is on track. For muscle: to hold or gain muscle while training for endurance, keep heavy lifting going (roughly 10 to 20 hard sets per muscle group a week when his week allows, progressing the weight), protect protein (1.6 to 2.2 g per kg) and total food, and cut lifting volume before intensity when time or recovery is short. "Life right now" tells you how much room he has. He may change these settings as his life changes.

How to answer:
- Use only the data below. If something is not in it, say so. Never invent numbers, dates or workouts.
- Give distances, heart rate zones and days when you suggest anything. Keep replies under 150 words unless he asks for detail.
- The app's own plan and rules come first. You can explain, compare and suggest swaps, and say what the trade-off is. You cannot change the plan or the app yourself; if he wants a plan change, say what you would change and that it needs to be made in the app.
- You are not a doctor. For chest pain, dizziness, fainting, illness that lingers, or an injury lasting more than 3 days, tell him to see a doctor.`

// The review runs after each Garmin refresh: the coach reads the data and the app's schedule and
// returns a small JSON object that the app shows on Today and, if it asks, applies to Coming up.
const REVIEW_SYSTEM = `${SYSTEM.split('\n\nHow to answer:')[0]}

Your job now is a review of today and the week ahead. Reply with ONLY a JSON object, no markdown and no other text:
{
  "headline": "one short sentence: what to do today",
  "lift": "today's lifting advice, under 140 characters",
  "run": "today's run advice with a distance and a heart rate or zone, under 160 characters",
  "why": "the numbers behind it, under 160 characters",
  "actions": [
    { "type": "move_run", "from": "YYYY-MM-DD", "to": "YYYY-MM-DD", "reason": "short" },
    { "type": "rest_day", "date": "YYYY-MM-DD", "reason": "short" },
    { "type": "note", "date": "YYYY-MM-DD", "text": "short note for that day, under 120 characters" },
    { "type": "set_rule", "field": "spacingDays | restAfter | legsBuffer | longRunKm", "value": 4, "reason": "short" }
  ],
  "offers": [
    { "date": "YYYY-MM-DD", "kind": "Run | Swim | Ride", "text": "the session with a distance and heart rate, under 160 characters", "reason": "short" }
  ]
}

Rules for the review:
- Use only the data below. Never invent numbers. Obey the app's schedule and rules: legs are not trained in the two days before or after a long run or inside the last 7 days before the race, a race-rhythm run day and the two days before the race are off from lifting, and the long run is not moved.
- Look at sleep, resting heart rate, HRV, yesterday's training, how his weeks have really looked and the sessions coming up. If recovery looks poor (short sleep, resting heart rate up, HRV down), lighten today and say what to cut.
- Actions never add training. If an extra session would suit his week and his life, put it in offers (at most 2, each with a distance and a heart rate); he accepts or declines. Offer only when his week has room, and push him gently when he has been consistent.
- If his logs show his lifting pattern has changed (fewer lifting days a week, a longer or shorter gap between the same lift), you may use one set_rule to match it. Only change a rule when the logs clearly show the change.
- Only add an action when a change is really needed, at most 3. "move_run" can only move a planned run listed in THIS WEEK's plan to a date in the next 7 days that has no run planned. "rest_day" is a full day off with no lifting or run. If no change is needed, "actions" must be [].
- Dates must be ISO dates within the next 7 days. Keep every string short and plain.`

const trim = (s, n) => String(s || '').slice(0, n)

// The model sometimes wraps JSON in a fence or a sentence; pull out the first object.
function extractJson(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

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
  // The saved value can carry extra text from a paste (spaces, line breaks, even a whole command), which
  // makes the request fail before it is sent. Take just the key out of it.
  const saved = process.env.ANTHROPIC_API_KEY || ''
  const squashed = saved.replace(/\s+/g, '')
  const found = squashed.match(/sk-ant-[A-Za-z0-9_-]+/)
  const apiKey = found ? found[0] : squashed
  if (!apiKey) {
    res.status(500).json({ error: 'The coach is not set up yet: ANTHROPIC_API_KEY is missing in the Vercel settings.' })
    return
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {}
  const review = body.mode === 'review'
  const question = review ? 'Review today and the week ahead and reply with the JSON object.' : trim(body.question, MAX_QUESTION).trim()
  if (!question) {
    res.status(400).json({ error: 'Ask a question first.' })
    return
  }

  // The earlier turns, oldest first, alternating and starting with the user, as the API requires.
  const history = []
  for (const m of Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || !m.content) continue
    const last = history[history.length - 1]
    if (last && last.role === m.role) continue
    history.push({ role: m.role, content: trim(m.content, 1500) })
  }
  while (history.length && history[0].role !== 'user') history.shift()
  if (history.length && history[history.length - 1].role === 'user') history.pop()

  const today = /^\d{4}-\d{2}-\d{2}$/.test(body.today || '') ? body.today : new Date().toISOString().slice(0, 10)
  const system = `${review ? REVIEW_SYSTEM : SYSTEM}\n\nCURRENT DATA (today is ${today}, Europe/Lisbon):\n${trim(body.context, MAX_CONTEXT)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 25000)
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: review ? 1100 : 700,
        system,
        messages: review ? [{ role: 'user', content: question }] : [...history, { role: 'user', content: question }]
      })
    })
    const data = await upstream.json().catch(() => ({}))
    if (!upstream.ok) {
      const msg = data && data.error && data.error.message ? data.error.message : `status ${upstream.status}`
      res.status(502).json({ error: `The coach could not answer: ${msg}` })
      return
    }
    const reply = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
    if (review) {
      const parsed = extractJson(reply)
      if (!parsed) {
        res.status(502).json({ error: 'The coach review came back in a form the app could not read.' })
        return
      }
      res.status(200).json({ review: parsed, model: MODEL })
      return
    }
    res.status(200).json({ reply: reply || 'No answer came back. Try again.', model: MODEL })
  } catch (err) {
    // say what really went wrong, with the key taken out of the message
    const clean = (t) => String(t || '').split(apiKey).join('[key]').replace(/sk-ant-[A-Za-z0-9_-]+/g, '[key]').slice(0, 160)
    const detail = err && err.name === 'AbortError' ? 'it took too long' : `${clean(err && err.name)}: ${clean(err && err.message)}${err && err.cause ? ` (${clean(err.cause.code || err.cause.message)})` : ''}`
    console.error('coach request failed:', clean(err && err.stack))
    res.status(502).json({ error: `The coach could not answer: ${detail}.` })
  } finally {
    clearTimeout(timer)
  }
}

function safeParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}
