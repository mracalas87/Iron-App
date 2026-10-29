import { useEffect, useState } from 'react'
import { CHART } from '../theme'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import LiftChart from './LiftChart'
import SportIcon from './Icons'
import Panel from './Panel'
import Coach from './Coach'
import { readReview, saveReview, requestReview, cleanReview, applyActions, undoApplied, acceptOffer, undoSession } from '../coachReview'
import { useGarmin } from '../useGarmin'
import { buildReport, statusColor } from '../report'
import { ADVICE_ZONES } from '../trainingAdvice'
import { getVitals, trendLabel, round } from '../vitals'
import { loadLocalEntries, buildFeed } from '../activityFeed'
import { syncRunsFromGarminCache } from '../db'
import { undoMove } from '../overrides'

const tooltipStyle = { background: CHART.tipBg, border: `1px solid ${CHART.grid}`, borderRadius: 8 }

// An off day or no-lifting day gets the ZZZ, any other lift the dumbbell.
const liftKind = (text) => (/^(Off day|No lifting)/.test(text || '') ? 'Rest' : 'Lift')

const firstSentence = (s) => (s ? s.split(/(?<=\.)\s/)[0] : s)

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function shortDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const fmtSwim = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${round(km, 1)} km`)

// What was done in the last 30 days, one icon and figure for each kind that has any.
function Last30Chips({ last30, size = 15 }) {
  if (!last30) return 'Lifting and running'
  const items = [
    last30.lifts > 0 && ['Lift', `${last30.lifts} ${last30.lifts === 1 ? 'lift' : 'lifts'}`],
    last30.runKm > 0 && ['Run', `${last30.runKm} km`],
    last30.swimKm > 0 && ['Swim', fmtSwim(last30.swimKm)],
    last30.rideKm > 0 && ['Ride', `${last30.rideKm} km`]
  ].filter(Boolean)
  if (!items.length) return 'Nothing logged in the last 30 days'
  return items.map(([kind, text]) => (
    <span key={kind} className="stat-chip">
      <SportIcon kind={kind} size={size} /> {text}
    </span>
  ))
}

// Six steps from worst (1) to best (6). Steps up to the current one are lit and the current one
// is outlined, so the bar shows exactly where you are. `groups` names the bands left to right.
function StepBar({ level, colours, groups }) {
  return (
    <div className="gauge slim steps">
      <div className="steps-track">
        {colours.map((c, i) => {
          const n = i + 1
          const cls = level == null ? '' : n === level ? ' current on' : n < level ? ' on' : ''
          return <div key={n} className={`step${cls}`} style={{ background: c }} />
        })}
      </div>
      <div className="gauge-labels">
        {groups.map((g) => (
          <span key={g.key} style={{ flex: g.count, color: level != null && g.has(level) ? g.color : undefined, fontWeight: level != null && g.has(level) ? 700 : undefined }}>
            {g.key}
          </span>
        ))}
      </div>
    </div>
  )
}

const RED = 'var(--danger)'
const AMBER = 'var(--warn)'
const GREEN = 'var(--pr)'
// Six bars that shift a step at a time from red on the left to green on the right.
const GRADIENT = ['#d93a2f', '#ea6a2b', '#f2a31b', '#c7bc1c', '#84b92a', '#3f9d2e']
// Recovery: Strained 1-3, Fair 4-5, Good 6. Training: Rest 1, Easy 2-3, Go 4-6.
const RECOVERY_BAR = {
  colours: GRADIENT,
  groups: [
    { key: 'Strained', count: 3, color: RED, has: (l) => l <= 3 },
    { key: 'Fair', count: 2, color: AMBER, has: (l) => l === 4 || l === 5 },
    { key: 'Good', count: 1, color: GREEN, has: (l) => l === 6 }
  ]
}
const TRAINING_BAR = {
  colours: GRADIENT,
  groups: [
    { key: 'Rest', count: 1, color: RED, has: (l) => l === 1 },
    { key: 'Easy', count: 2, color: AMBER, has: (l) => l === 2 || l === 3 },
    { key: 'Go', count: 3, color: GREEN, has: (l) => l >= 4 }
  ]
}

function MiniTile({ label, value, unit, trend }) {
  return (
    <div className="mini-tile">
      <div className="label">{label}</div>
      <div className="value">
        {value ?? '—'}
        {value != null && unit && <span className="unit">{unit}</span>}
      </div>
      <div className="trend" style={{ color: trend?.color }}>
        {trend?.text || ' '}
      </div>
    </div>
  )
}

function Trend({ title, data, dataKey, color, domain }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="dim-label">{title}</div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 10 }} axisLine={{ stroke: CHART.grid }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={28} domain={domain} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: CHART.text }} itemStyle={{ color }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function KeyCard({ onSave }) {
  const [value, setValue] = useState('')
  return (
    <div className="card">
      <div className="dim-label">Connect Garmin</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <input type="password" placeholder="Garmin access key" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={!value.trim()} onClick={() => onSave(value)}>
        Save
      </button>
    </div>
  )
}

export default function Home({ activeWorkout, onOpenLog, resetTick }) {
  const garmin = useGarmin()
  const [open, setOpen] = useState(null) // which panel is open: 'today' | 'coming' | ... | null
  const [moveTick, setMoveTick] = useState(0) // bumped when a run is moved, to rebuild the plan
  const [stats, setStats] = useState(null)
  const [local, setLocal] = useState([])
  const idle = !activeWorkout // recompute after a workout is saved

  // Undo a run move the coach made: the run goes back to its planned day.
  const localToday = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 10)
  }
  const undo = (from) => {
    undoMove(from)
    setMoveTick((n) => n + 1)
  }

  // Close the open panel and return to the top of the panel list.
  const goHome = () => {
    setOpen(null)
    document.querySelector('.app-content')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }
  // Tapping the Home tab while already on Home does the same.
  useEffect(() => {
    if (resetTick) goHome()
  }, [resetTick])

  // Recompute whenever Garmin data changes or a workout has just been saved.
  useEffect(() => {
    let live = true
    syncRunsFromGarminCache()
      .then(() => Promise.all([buildReport(), loadLocalEntries()]))
      .then(([s, l]) => {
        if (live) {
          setStats(s)
          setLocal(l)
        }
      })
    return () => {
      live = false
    }
  }, [garmin.data, idle, moveTick])

  // The coach's review of today, made only when Andy taps the Coach button (each review costs a little),
  // and kept for the day. It lightens the day, moves a run or adds a rest day when needed (each with an
  // Undo), and offers extra sessions.
  const [review, setReview] = useState(readReview)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const runReview = async (forKey) => {
    if (!stats || !garmin.accessKey || reviewing) return
    const today = localToday()
    setReviewing(true)
    setReviewError('')
    try {
      const raw = await requestReview({ context: stats.coachContext, accessKey: garmin.accessKey, today })
      const clean = cleanReview(raw, today)
      const applied = applyActions(clean.actions)
      const prev = review && review.date === today ? review : null
      const declined = (prev ? prev.offers || [] : []).filter((o) => o.state === 'declined')
      const offers = clean.offers
        .filter((o) => !declined.some((d) => d.date === o.date && d.kind === o.kind))
        .map((o) => ({ ...o, state: 'open' }))
      const saved = {
        for: forKey,
        date: today,
        at: Date.now(),
        headline: clean.headline,
        lift: clean.lift,
        run: clean.run,
        why: clean.why,
        week: clean.week,
        applied: [...(prev ? prev.applied || [] : []), ...applied],
        offers: [...declined, ...offers],
        sessions: prev ? prev.sessions || [] : []
      }
      saveReview(saved)
      setReview(saved)
      if (applied.length) setMoveTick((n) => n + 1)
    } catch (e) {
      setReviewError(e.message || 'The coach review did not work.')
    } finally {
      setReviewing(false)
    }
  }

  const persistReview = (next) => {
    saveReview(next)
    setReview(next)
    setMoveTick((n) => n + 1)
  }
  const undoChange = (i) => {
    undoApplied(review.applied[i])
    persistReview({ ...review, applied: review.applied.filter((_, k) => k !== i) })
  }
  const decideOffer = (i, accept) => {
    const o = review.offers[i]
    if (accept) {
      const s = acceptOffer(o)
      persistReview({ ...review, offers: review.offers.map((x, k) => (k === i ? { ...x, state: 'accepted' } : x)), sessions: [...(review.sessions || []), s] })
    } else {
      persistReview({ ...review, offers: review.offers.map((x, k) => (k === i ? { ...x, state: 'declined' } : x)) })
    }
  }
  const undoAccepted = (j) => {
    undoSession(review.sessions[j])
    persistReview({ ...review, sessions: review.sessions.filter((_, k) => k !== j) })
  }

  const v = getVitals(garmin.data)
  const hasData = v.hasData
  const labels = v.dates.map(shortDate)
  const chart = labels.map((label, i) => ({
    label,
    hrv: v.hrv.values[i],
    rhr: v.restingHR.values[i],
    sleep: v.sleepHours.values[i] != null ? round(v.sleepHours.values[i], 1) : null
  }))
  const feed = buildFeed(garmin.data, local, 5)
  const advice = stats?.advice
  // the Trend line already carries the trend signals, so they are left out here
  const trendTexts = new Set((stats?.trend?.signals || []).map((s) => s.text))
  const reasonsLine = stats
    ? [...stats.reasons, ...(advice?.reasons || [])].filter((r) => !trendTexts.has(r) || stats.trend.level === 'steady').slice(0, 2).join(' · ')
    : ''
  const sleepTrend = trendLabel(v.sleepHours.delta != null ? v.sleepHours.delta * 60 : null, 'min', true)

  const word = (s) => (s && s !== '—' ? s : null)
  const nextUp = stats ? stats.upcoming.rows.find((r) => r.lift || r.cardio.length > 0) : null
  const comingSummary = nextUp ? `${nextUp.label}: ${nextUp.lift || nextUp.cardio[0].kind}` : 'Nothing planned'
  const statsSummary = `HRV ${round(v.hrv.latest) ?? '—'} · RHR ${round(v.restingHR.latest) ?? '—'} · Sleep ${v.sleepHours.latest != null ? round(v.sleepHours.latest, 1) + 'h' : '—'}`
  const monthSummary = (
    <span className="chips-inline">
      <Last30Chips last30={stats?.last30} />
    </span>
  )
  const recentSummary = feed.length ? `${feed[0].title} · ${shortDate(feed[0].date)}` : 'Nothing yet'

  const fresh = !!(review && review.date === localToday() && review.headline)
  const todaySummary = stats && hasData ? (fresh ? review.headline : advice.headline) : 'Tap to load your Garmin data'
  const coachBadge = reviewing ? (
    <div className="coach-badge">Coach is reviewing your data…</div>
  ) : fresh ? (
    <div className="coach-badge">Coach review · {new Date(review.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
  ) : null
  const staleHint =
    fresh && garmin.data?.fetchedAt && review.for !== garmin.data.fetchedAt ? (
      <div className="advice-why">Garmin data is newer than this review. Tap ↻ Coach for a new one.</div>
  ) : null
  const openOffers = fresh ? (review.offers || []).map((o, i) => ({ o, i })).filter(({ o }) => o.state === 'open') : []
  const coachExtras = (
    <>
      {fresh && (review.applied || []).length > 0 && (
        <div className="coach-changes">
          <div className="dim-label">Coach changed</div>
          {review.applied.map((a, i) => (
            <div className="coach-change" key={a.type + a.key}>
              <span>{a.label}</span>
              <button className="mini-act" onClick={() => undoChange(i)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
      {openOffers.length > 0 && (
        <div className="coach-changes">
          <div className="dim-label">Coach offers</div>
          {openOffers.map(({ o, i }) => (
            <div className="coach-change" key={o.date + o.kind}>
              <span>
                <SportIcon kind={o.kind} /> {shortDate(o.date)}: {o.text}
                {o.reason ? ` (${o.reason})` : ''}
              </span>
              <span className="coach-btns">
                <button className="mini-act" onClick={() => decideOffer(i, true)}>
                  Accept
                </button>
                <button className="mini-act quiet" onClick={() => decideOffer(i, false)}>
                  No thanks
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      {fresh && (review.sessions || []).length > 0 && (
        <div className="coach-changes">
          <div className="dim-label">Added from the coach</div>
          {review.sessions.map((s, j) => (
            <div className="coach-change" key={s.key}>
              <span>{s.label}</span>
              <button className="mini-act" onClick={() => undoAccepted(j)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
      {!reviewing && reviewError && <div className="advice-why">Coach review unavailable: {reviewError}</div>}
    </>
  )
  const todayPreview =
    stats && hasData ? (
      <div className="duo preview-bars">
        <div>
          <div className="duo-label">
            Recovery · <b style={{ color: statusColor(stats.status) }}>{word(stats.status)}</b>
          </div>
          <StepBar level={stats.level} {...RECOVERY_BAR} />
        </div>
        <div>
          <div className="duo-label">
            Training · <b style={{ color: ADVICE_ZONES.find((z) => z.key === advice.zone)?.color }}>{advice.zone || '—'}</b>
          </div>
          <StepBar level={advice.level} {...TRAINING_BAR} />
        </div>
      </div>
    ) : null

  return (
    <div>
      {!garmin.accessKey && !hasData && <KeyCard onSave={garmin.saveKey} />}

      {activeWorkout && (
        <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={onOpenLog}>
          Resume workout
        </button>
      )}

      <Panel id="today" icon="today" title="Today" summary={todaySummary} preview={todayPreview} open={open} onToggle={setOpen} onHome={goHome}>
        <div className="status-head">
          <div className="dim-label" style={{ margin: 0 }}>
            {garmin.data?.fetchedAt ? `Synced ${timeAgo(garmin.data.fetchedAt)}` : 'Not synced yet'}
          </div>
          <div className="refresh-group">
            <button className="refresh-btn" onClick={garmin.refresh} disabled={garmin.loading || !garmin.accessKey}>
              {garmin.loading ? 'Refreshing…' : '↻ Garmin'}
            </button>
            <button
              className="refresh-btn"
              onClick={() => runReview(garmin.data?.fetchedAt || 'manual')}
              disabled={reviewing || !stats || !garmin.accessKey}
            >
              {reviewing ? 'Reviewing…' : '↻ Coach'}
            </button>
          </div>
        </div>
        {garmin.error && <div className="err-line">{garmin.error}</div>}

        {!hasData ? (
          <div className="dim-text" style={{ padding: '10px 0 2px' }}>Tap Refresh to load your Garmin data.</div>
        ) : (
          stats && (
            <>
              <div className="duo">
                <div>
                  <div className="duo-label">Recovery</div>
                  <div className="duo-value" style={{ color: statusColor(stats.status) }}>{stats.status}</div>
                  <StepBar level={stats.level} {...RECOVERY_BAR} />
                </div>
                <div>
                  <div className="duo-label">Training</div>
                  <div className="duo-value" style={{ color: ADVICE_ZONES.find((z) => z.key === advice.zone)?.color }}>
                    {advice.zone || '—'}
                  </div>
                  <StepBar level={advice.level} {...TRAINING_BAR} />
                </div>
              </div>

              <div className="advice">
                {coachBadge}
                {staleHint}
                <div className="advice-headline">{fresh ? review.headline : advice.headline}</div>
                {advice.plan && (
                  <div className="advice-line">
                    <span>Plan</span> {advice.plan}
                  </div>
                )}
                {advice.strength && (
                  <div className="advice-line">
                    <SportIcon kind={liftKind(fresh && review.lift ? review.lift : advice.liftBrief || advice.strength)} />{' '}
                    {fresh && review.lift ? review.lift : advice.liftBrief || firstSentence(advice.strength)}
                  </div>
                )}
                {advice.run && (
                  <div className="advice-line">
                    <SportIcon kind="Run" /> {fresh && review.run ? review.run : firstSentence(advice.run)}
                  </div>
                )}
                {stats.trend && stats.trend.level !== 'steady' && (
                  <div className={`trend-line ${stats.trend.level}`}>
                    <span>Trend</span> {stats.trend.summary}
                  </div>
                )}
                {fresh && review.week && (
                  <div className="advice-line">
                    <span>Week</span> {review.week}
                  </div>
                )}
                {fresh && review.why ? <div className="advice-why">{review.why}</div> : reasonsLine && <div className="advice-why">{reasonsLine}</div>}
                {coachExtras}
              </div>
            </>
          )
        )}
      </Panel>

      {stats && (
        <Panel id="coach" icon="coach" title="Ask coach" summary="Questions about your training and plan" open={open} onToggle={setOpen} onHome={goHome}>
          <Coach context={stats.coachContext} accessKey={garmin.accessKey} />
        </Panel>
      )}

      {stats && stats.upcoming.rows.length > 0 && (
        <Panel id="coming" icon="coming" title="Coming up" summary={comingSummary} open={open} onToggle={setOpen} onHome={goHome}>
          {stats.upcoming.rows.filter((row) => row.lift || row.cardio.length > 0).map((row) => (
            <div className="up-row" key={row.date}>
              <div className="up-day">{row.label}</div>
              <div className="up-body">
                {row.lift && (
                  <div>
                    <SportIcon kind={liftKind(row.lift)} /> {row.lift}
                  </div>
                )}
                {row.cardio.map((c) => (
                  <div key={c.kind + c.text}>
                    <SportIcon kind={c.kind} /> {c.text}
                    {c.movedFrom && <span className="up-note"> (moved from {shortDate(c.movedFrom)})</span>}
                    {c.carriedFrom && <span className="up-note"> (carried over from {shortDate(c.carriedFrom)}, missed)</span>}
                  </div>
                ))}
                {row.note && <div className="up-note">{row.note}</div>}
                {row.undoMove && (
                  <button className="mini-act" onClick={() => undo(row.undoMove)}>
                    Undo move
                  </button>
                )}
              </div>
            </div>
          ))}
          {stats.upcoming.liftKnown && stats.upcoming.cycle.done.length + stats.upcoming.cycle.due.length > 0 && (
            <div className="up-note" style={{ padding: '8px 0 10px' }}>
              This cycle: {stats.upcoming.cycle.done.length ? `done ${stats.upcoming.cycle.done.join(', ')}` : 'nothing done yet'}
              {stats.upcoming.cycle.due.length ? `. Still due: ${stats.upcoming.cycle.due.join(', ')}.` : '. Cycle complete.'}
            </div>
          )}
          {!stats.upcoming.liftKnown && (
            <div className="up-note" style={{ padding: '8px 0 10px' }}>Log your lifts to see which one is next.</div>
          )}
        </Panel>
      )}

      {hasData && (
        <Panel id="stats" icon="stats" title="Stats" summary={statsSummary} open={open} onToggle={setOpen} onHome={goHome}>
          <div className="mini-row" style={{ marginBottom: 0 }}>
            <MiniTile label="HRV" value={round(v.hrv.latest)} unit="ms" trend={trendLabel(v.hrv.delta, 'ms', true)} />
            <MiniTile label="Resting HR" value={round(v.restingHR.latest)} unit="bpm" trend={trendLabel(v.restingHR.delta, 'bpm', false)} />
            <MiniTile label="Sleep" value={v.sleepHours.latest != null ? round(v.sleepHours.latest, 1) : null} unit="h" trend={sleepTrend} />
          </div>
        </Panel>
      )}

      <Panel id="month" icon="month" title="Last 30 days" summary={monthSummary} open={open} onToggle={setOpen} onHome={goHome}>
        <div className="chips-row">
          <Last30Chips last30={stats?.last30} size={18} />
        </div>
        <LiftChart refreshKey={idle} bare />
      </Panel>

      {feed.length > 0 && (
        <Panel id="recent" icon="recent" title="Recent" summary={recentSummary} open={open} onToggle={setOpen} onHome={goHome}>
          {feed.map((item) => (
            <div className="feed-row" key={item.key}>
              <div style={{ minWidth: 0 }}>
                <span className="feed-title">{item.title}</span>
                <span className="feed-sub"> · {item.subtitle}</span>
              </div>
              <span className="feed-date">{shortDate(item.date)}</span>
            </div>
          ))}
        </Panel>
      )}

      {stats && hasData && (
        <Panel id="details" icon="details" title="Detailed look" summary="Vitals, trends and the full advice" open={open} onToggle={setOpen} onHome={goHome}>
          {stats.vitalRows.length > 0 && (
            <div>
              <div className="dim-label">Vitals</div>
              {stats.vitalRows.map((row) => (
                <div className="vital-row" key={row.name}>
                  <div>
                    <div className="name">{row.name}</div>
                    {row.detail && <div className="detail">{row.detail}</div>}
                  </div>
                  <div className="figure">
                    <div>{row.figure}</div>
                    {row.trend.text && <div style={{ fontSize: 11, color: row.trend.color, marginTop: 2 }}>{row.trend.text}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <Trend title="HRV (ms)" data={chart} dataKey="hrv" color={CHART.run} domain={['dataMin - 8', 'dataMax + 8']} />
            <Trend title="Resting HR (bpm)" data={chart} dataKey="rhr" color={CHART.volume} domain={['dataMin - 3', 'dataMax + 3']} />
            <Trend title="Sleep (h)" data={chart} dataKey="sleep" color={CHART.teal} domain={[0, 'dataMax + 1']} />
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="dim-label">Advice in full</div>
            {advice.plan && <div className="detail-line"><span>Plan</span> {advice.plan}</div>}
            {advice.strength && <div className="detail-line"><span>Lift</span> {advice.strength}</div>}
            {advice.run && <div className="detail-line"><span>Run</span> {advice.run}</div>}
            {advice.tip && <div className="detail-line">{advice.tip}</div>}
            {stats.notes.map((n) => (
              <div className="detail-line" key={n}>{n}</div>
            ))}
            <div className="basis">
              {stats.basis} Rules: sleep 7h or more (AASM/SRS 2015), multi-day HRV and resting-HR trends (Plews 2013), a week of
              running over 1.5x your recent average (Gabbett 2016), hard days followed by easy ones (convention), taper (Bosquet
              2007). Not medical advice.
            </div>
          </div>

          <button className="btn-ghost" style={{ color: 'var(--danger)', display: 'block', margin: '12px auto 0' }} onClick={garmin.forgetKey}>
            Forget access key
          </button>
        </Panel>
      )}
    </div>
  )
}
