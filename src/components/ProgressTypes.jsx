import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { CHART } from '../theme'
import { listWorkouts, listExercises, MUSCLE_GROUPS } from '../db'
import { groupSeries, verdict } from '../liftStats'
import { TYPES, TYPE_INFO, TYPE_COLOUR, MAX_SESSION_SETS } from '../research'
import { EXPERIENCE, readStats, saveStats, proteinRange } from '../bodyStats'
import { buildTargets } from '../targets'

const short = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const kfmt = (v) => (v >= 1000 ? Math.round(v / 100) / 10 + 'k' : v)

function StatsCard({ stats, onChange }) {
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
        <div className="field">
          <label htmlFor="st-freq">Sessions a week per muscle</label>
          <select id="st-freq" value={stats.sessionsPerWeek || ''} onChange={(e) => onChange({ sessionsPerWeek: e.target.value || null })}>
            <option value="">Auto, from your log</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} a week</option>
            ))}
          </select>
        </div>
      </div>
      <div className="pt-note">
        {protein ? `For muscle, aim for about ${protein[0]} to ${protein[1]} g of protein a day (1.6 to 2.2 g per kg, Morton 2018). ` : 'Add your body weight for a protein range and your strength against body weight. '}
        These stats and the variables below set the target line on each chart.
      </div>
    </div>
  )
}

function TargetCard({ group, targets }) {
  if (!targets) return null
  return (
    <details className="card pt-vars">
      <summary>
        <span className="pt-label" style={{ margin: 0 }}>What sets your {group.toLowerCase()} target</span>
        <span className="pt-vars-sum">sets x{targets.factor}</span>
      </summary>
      <p className="pt-note" style={{ marginTop: 8 }}>
        The target line is the research dose for a {group.toLowerCase()} session of each type, in kg lifted, at your current best weights. Each
        variable below raises or trims the number of hard sets (never fewer than 2 a lift, never more than {MAX_SESSION_SETS.Heavy} heavy, {MAX_SESSION_SETS.Mixed} mixed or {MAX_SESSION_SETS.Volume} volume sets a session).
      </p>
      {targets.items.map((i) => (
        <div key={i.key} className="pt-var">
          <div className="pt-var-top">
            <span className="pt-var-name">{i.label}</span>
            <span className="pt-var-val">{i.value} · x{i.effect}</span>
          </div>
          <div className="pt-var-src">from {i.source}</div>
          <div className="pt-var-note">{i.note}</div>
        </div>
      ))}
      <div className="pt-label" style={{ margin: '12px 0 4px' }}>Also keep in mind</div>
      <ul className="mgp-why" style={{ marginTop: 0 }}>
        {targets.keep.map((k) => <li key={k}>{k}</li>)}
      </ul>
    </details>
  )
}

function Tip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0].payload
  return (
    <div className="pt-tip">
      <div className="pt-tip-date">{label}</div>
      <div>You: {row.actual.toLocaleString('en-GB')} kg · {row.sets} sets · about {row.medianReps} reps · {row.intensity}%</div>
      {row.optimal ? <div>Target: {row.optimal.toLocaleString('en-GB')} kg · {row.optimalSets} sets</div> : null}
      {row.perBodyweight ? <div>Top lift {row.perBodyweight} x body weight</div> : null}
    </div>
  )
}

function TypeChart({ type, group, series }) {
  const colour = TYPE_COLOUR[type]
  const info = TYPE_INFO[type]
  const { rows, optimal, optimalSets, hasLifts } = series
  const data = rows.map((r) => ({ ...r, label: short(r.date) }))
  const last = rows[rows.length - 1]
  const say = verdict(type, rows, group)

  return (
    <div className="card">
      <div className="pt-head">
        <span className="pt-dot" style={{ background: colour }} />
        <span className="pt-label" style={{ margin: 0 }}>{type} {group.toLowerCase()} · last {rows.length || 10}</span>
      </div>
      <div className="pt-goal">
        {info.goal} Aim: {optimalSets} hard sets, {info.reps[0]} to {info.reps[1]} reps at {info.intensity[0]} to {info.intensity[1]}% of your max
        {optimal ? `, about ${optimal.toLocaleString('en-GB')} kg lifted a session.` : '.'}
      </div>

      {!hasLifts ? (
        <div className="pt-empty">No {group.toLowerCase()} lifts logged yet, so there is no weight to set the target from.</div>
      ) : rows.length < 2 ? (
        <div className="pt-empty">
          {rows.length === 0
            ? `No ${type.toLowerCase()} ${group.toLowerCase()} workouts yet. A workout counts as ${type.toLowerCase()} from the weight on each set against your best on that lift.`
            : 'One workout so far. The chart starts with two.'}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={{ stroke: CHART.grid }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: CHART.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={kfmt} domain={[(min) => Math.max(0, Math.floor((Math.min(min, optimal || min) * 0.85) / 100) * 100), (max) => Math.ceil((Math.max(max, optimal || max) * 1.1) / 100) * 100]} />
              <Tooltip content={<Tip />} />
              <Line type="linear" dataKey="optimal" name="Target" stroke="#111111" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" name="You" stroke={colour} strokeWidth={2.5} dot={{ r: 3, fill: colour, stroke: 'none' }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="pt-legend">
            <span><i style={{ background: colour }} /> Your {group.toLowerCase()} work (kg lifted)</span>
            <span><i className="dash" /> Target for a {type.toLowerCase()} {group.toLowerCase()} session</span>
          </div>
        </>
      )}

      {last && (
        <div className="pt-metrics">
          <div className="metric-box">
            <div className="label">Sets</div>
            <div className="value">{last.sets}</div>
            <div className="pt-target">aim {optimalSets}</div>
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
      {last && <div className="pt-foot">Latest {type.toLowerCase()} {group.toLowerCase()} workout, {short(last.date)}.{last.perBodyweight ? ` Top lift ${last.topEst} kg, ${last.perBodyweight} x your body weight.` : ''}</div>}
      {say && <div className="pt-verdict">{say}</div>}
    </div>
  )
}

export default function ProgressTypes() {
  const [stats, setStats] = useState(readStats)
  const [data, setData] = useState(null)
  const [group, setGroup] = useState(null)
  const [targets, setTargets] = useState(null)

  useEffect(() => {
    let live = true
    Promise.all([listWorkouts(), listExercises()]).then(([workouts, exercises]) => {
      if (!live) return
      setData({ workouts, exercises })
      // open on the muscle trained most recently
      const recent = workouts.find((w) => (w.muscleGroups || []).length)
      setGroup((recent && recent.muscleGroups[0]) || 'Chest')
    })
    return () => {
      live = false
    }
  }, [])

  useEffect(() => {
    if (!data || !group) return
    let live = true
    buildTargets(group, stats, data.workouts).then((t) => live && setTargets(t))
    return () => {
      live = false
    }
  }, [data, group, stats])

  if (!data || !group) return <div className="empty-state"><p>Loading…</p></div>

  const factor = targets ? targets.factor : 1

  return (
    <div>
      <StatsCard stats={stats} onChange={(patch) => setStats(saveStats(patch))} />

      <div className="pt-label" style={{ margin: '4px 2px 6px' }}>Muscle</div>
      <div className="chip-row" style={{ marginBottom: 12 }}>
        {MUSCLE_GROUPS.map((g) => (
          <button key={g} className={`chip${g === group ? ' active' : ''}`} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>

      <TargetCard group={group} targets={targets} />

      {data.workouts.length === 0 && (
        <div className="empty-state">
          <div className="mark">—</div>
          <p>Log a few workouts and the charts fill in.</p>
        </div>
      )}
      {TYPES.map((t) => (
        <TypeChart key={t} type={t} group={group} series={groupSeries(data.workouts, data.exercises, group, t, stats, factor)} />
      ))}
      <p className="mgp-foot">
        Each chart shows the kg lifted on your {group.toLowerCase()} working sets (warm-ups left out) for the last ten workouts of that type, against one fixed
        target for a {group.toLowerCase()} session of that type: the sets, reps and percentage of your best max that studies find work best (ACSM 2009;
        Schoenfeld 2016, 2017, 2021), at your current best weights and scaled by the variables above. The line only moves when your strength
        or those variables change. It is a guide from group averages, and a session well above the line is not better: sets beyond the dose add little.
      </p>
    </div>
  )
}
