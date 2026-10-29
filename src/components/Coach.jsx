import { useEffect, useRef, useState } from 'react'

// The in-app coach: ask a question and get an answer from Claude, using a summary of the latest
// training and health data. The server function (api/coach.js) holds the API key.

const KEY = 'iron-coach-chat'
const SUGGESTIONS = ['Is it okay to run today?', 'How was my last run?', 'Am I ready for Lisbon?', 'What should I change this week?']

function loadChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(saved) ? saved.slice(-20) : []
  } catch {
    return []
  }
}

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function Coach({ context, accessKey }) {
  const [messages, setMessages] = useState(loadChat)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)
  const lastBotRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages.slice(-20)))
    } catch {
      // storage blocked: the chat only lasts until the app is closed
    }
    // a new answer is shown from its first line; anything else scrolls to the end
    const last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && !busy) lastBotRef.current?.scrollIntoView({ block: 'start' })
    else endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages, busy])

  async function send(question) {
    const q = (question ?? text).trim()
    if (!q || busy) return
    setText('')
    setError('')
    const history = messages
    setMessages([...history, { role: 'user', content: q }])
    setBusy(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-garmin-key': accessKey || '' },
        body: JSON.stringify({ question: q, history: history.slice(-8), context, today: todayISO() })
      })
      const raw = await res.text()
      let data = null
      try {
        data = JSON.parse(raw)
      } catch {
        // not JSON: the function is not there (for example on a local test server)
      }
      if (!res.ok || !data || !data.reply) {
        throw new Error(
          (data && data.error) ||
            (res.status === 404 ? 'The coach is not available here. It only works on the deployed app.' : `The coach did not answer (status ${res.status}).`)
        )
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err.message || 'The coach did not answer. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="coach">
      {messages.length === 0 && (
        <div className="coach-intro">
          Ask about today, your runs, your plan or your recovery. I read your latest lifts, runs, sleep and heart rate first.
          <div className="coach-sugg">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="mini-act" onClick={() => send(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="coach-log">
        {messages.map((m, i) => (
          <div key={i} ref={i === messages.length - 1 && m.role === 'assistant' ? lastBotRef : null} className={`coach-msg ${m.role === 'user' ? 'me' : 'bot'}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="coach-msg bot dim">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {error && <div className="err-line">{error}</div>}

      <div className="coach-input">
        <textarea
          rows={2}
          placeholder="Ask the coach…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button className="btn btn-primary" onClick={() => send()} disabled={busy || !text.trim()}>
          Send
        </button>
      </div>

      <div className="coach-foot">
        AI coach, so it can be wrong. Not medical advice.
        {messages.length > 0 && (
          <button className="btn-ghost" onClick={() => setMessages([])}>
            Clear chat
          </button>
        )}
      </div>
    </div>
  )
}
