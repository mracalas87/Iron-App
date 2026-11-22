import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { CHART } from '../theme'
import { listWorkouts, listExercises } from '../db'
import { typedWorkouts, lastTen, verdict } from '../liftStats'
import { TYPES, TYPE_INFO, TYPE_COLOUR } from '../research'
import { EXPERIENCE, readStats, saveStats, setsFactor, ageFactor, proteinRange } from '../bodyStats'

const short = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const kfmt = (v) => (v >= 1000 ? Math.round(v / 100) / 10 + 'k' : v)

function StatsCard({ stats, onChange }) {
  const factor = setsFactor(stats)
  const protein = proteinRange(stats.weightKg)
  return (
    <div className="card">
      <div className="pt-label">Your stats</div>
      <div className="pt-stats">
        <div className="field">
          <label htmlFor="st-age">Age</label>
          <input id="st-age" type="number" inputMode="numeric" min="14" max="90" defaultValue={stats.age} onBlur={(e) => onChange({ age: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="st-kg">Body weight (kg)</label>
          <input id="st-kg" type="number" inputMode="decimal" min="30" max="250" step="0.1" placeholder="e.g. 80" defaultValue={stats.weightKg ?? ''} onBlur={(e) => onChange({ weightKg: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="st-exp">Lifting for</label>
          <select id="st-exp" value={stats.experience} onChange={(e) => onChange({ experience: e.target.value })}>
            {EXPERIENCE.map((x) => (
              <option key={x.id} value={x.id}>{x.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-note">
        The research dose is set to {Math.round(factor * 100)}% of the standard number of sets for your training years
        {ageFactor(stats.age) < 1 ? ' and age (recovery slows with age)' : ''}.
        {protein ? ` For muscle, aim for about ${protein[0]} to ${protein[1]} g of protein a day (1.6 to 2.2 g per kg, Morton 2018).` : ' Add your body weight for a protein range and your strength against body weight.'}
      </div>
    </div>
  )
}

function Tip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0].payload
  return (
    <div className="pt-tip">
      <div className="pt-tip-date">{label}</div>
      <div>You: {row.actual.toLocaleString('en-GB')} kg · {row.sets} sets · about {row.medianReps} reps · {row.intensity}%</div>
      {row.optimal ? <div>Research: {row.optimal.toLocaleString('en-GB')} kg · {row.optimalSets} sets</div> : null}
      {row.perBodyweight ? <div>Top lift {row.perBodyweight} x body weight</div> : null}
    </div>
  )
}

function TypeChart({ type, rows }) {
  const colour = TYPE_COLOUR[type]
  const info = TYPE_INFO[type]
  const data = rows.map((r) => ({ ...r, label: short(r.date) }))
  const last = rows[rows.length - 1]
  const say = verdict(type, rows)

  return (
    <div className="card" style={{ borderColor: colour }}>
      <div className="pt-head">
        <span className="pt-dot" style={{ background: colour }} />
        <span className="pt-label" style={{ margin: 0 }}>{type} workouts · last {rows.length || 10}</span>
      </div>
      <div className="pt-goal">{info.goal} Target: {info.reps[0]} to {info.reps[1]} reps at {info.intensity[0]} to {info.intensity[1]}% of your max.</div>

      {rows.length < 2 ? (
        <div className="pt-empty">
          {rows.length === 0
            ? `No ${type.toLowerCase()} workouts yet. A workout counts as ${type.toLowerCase()} from the weight on each set against your best on that lift.`
            : 'One workout so far. The chart starts with two.'}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={kfmt} domain={[(min) => Math.max(0, Math.floor((min * 0.85) / 100) * 100), (max) => Math.ceil((max * 1.1) / 100) * 100]} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="optimal" name="Research" stroke="#eaf8fb" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" name="You" stroke={colour} strokeWidth={2.5} dot={{ r: 3, fill: colour, stroke: 'none' }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="pt-legend">
            <span><i style={{ background: colour }} /> Your workout (kg lifted)</span>
            <span><i className="dash" /> Research dose for the same lifts</span>
          </div>
        </>
      )}

      {last && (
        <div className="pt-metrics">
          <div className="metric-box">
            <div className="label">Sets</div>
            <div className="value">{last.sets}</div>
            <div className="pt-target">research {last.optimalSets}</div>
          </div>
          <div className="metric-box">
            <div className="label">Reps a set</div>
            <div className="value">{last.medianReps}</div>
            <div className="pt-target">aim {info.reps[0]} to {info.reps[1]}</div>
          </div>
          <div className="metric-box">
            <div className="label">Intensity</div>
            <div className="value">{last.intensity}%</div>
            <div className="pt-target">aim {info.intensity[0]} to {info.intensity[1]}%</div>
          </div>
        </div>
      )}
      {last && <div className="pt-foot">Latest {type.toLowerCase()} workout, {short(last.date)}.{last.perBodyweight ? ` Top lift ${last.topEst} kg, ${last.perBodyweight} x your body weight.` : ''}</div>}
      {say && <div className="pt-verdict">{say}</div>}
    </div>
  )
}

export default function ProgressTypes() {
  const [stats, setStats] = useState(readStats)
  const [data, setData] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([listWorkouts(), listExercises()]).then(([workouts, exercises]) => {
      if (!live) return
      const categoryOf = new Map(exercises.map((e) => [e.id, e.category]))
      setData({ workouts, typed: typedWorkouts(workouts, categoryOf) })
    })
    return () => {
      live = false
    }
  }, [])

  if (!data) return <div className="empty-state"><p>Loading…</p></div>
  const factor = setsFactor(stats)

  return (
    <div>
      <StatsCard stats={stats} onChange={(patch) => setStats(saveStats(patch))} />
      {data.typed.length === 0 && (
        <div className="empty-state">
          <div className="mark">—</div>
          <p>Log a few workouts and the three charts fill in.</p>
        </div>
      )}
      {TYPES.map((t) => (
        <TypeChart key={t} type={t} rows={lastTen(data.typed, t, data.workouts, stats, factor)} />
      ))}
      <p className="mgp-foot">
        Each chart shows kg lifted on your working sets (warm-ups left out) against the research dose for the same lifts: the sets,
        reps and percentage of your best max that studies find work best for that type of session (ACSM 2009; Schoenfeld 2016, 2017, 2021),
        scaled for your age and lifting years. Sessions with more than one muscle group get a larger dose. It is a guide from group
        averages, and a session well above the line is not better: extra sets beyond the dose add little.
      </p>
    </div>
  )
}
