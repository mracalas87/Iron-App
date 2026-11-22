import { useEffect, useState } from 'react'
import { listWorkouts, listExercises, addExercise } from '../db'
import { buildReference } from '../loadType'
import { typedWorkouts, topWorkout } from '../liftStats'
import { researchWorkout, TYPES, TYPE_COLOUR } from '../research'
import { readStats, setsFactor, ageFactor } from '../bodyStats'
import { GROUP_STYLE } from '../groupStyle'
import { MuscleIcon } from './Icons'

const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// "100x5, 100x5, 100x4" -> "2 x 100x5, 100x4" would be harder to read at a glance, so identical sets are counted.
function setsText(sets) {
  const parts = []
  for (const s of sets || []) {
    const t = `${s.weight}kg x ${s.reps}`
    const last = parts[parts.length - 1]
    if (last && last.t === t) last.n++
    else parts.push({ t, n: 1 })
  }
  return parts.map((p) => (p.n > 1 ? `${p.n} x ${p.t}` : p.t)).join(', ')
}

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

// A logged workout as an editable draft for today, the same shape History's "Repeat this workout" makes.
function repeatDraft(workout) {
  return {
    title: workout.title,
    date: todayISO(),
    muscleGroups: workout.muscleGroups || [],
    exercises: (workout.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((s) => ({ reps: String(s.reps), weight: String(s.weight) }))
    }))
  }
}

// The research session as a draft: your own lift where it is in your log, otherwise the suggested lift
// (added to your exercise list under this muscle group), with the sets, reps and weight filled in.
async function researchDraft(plan, group, type) {
  const exercises = []
  for (const b of plan.blocks) {
    let id = b.loggedId
    let name = b.logged
    if (id == null) {
      const made = await addExercise(b.name, group)
      id = made.id
      name = made.name
    }
    exercises.push({
      exerciseId: id,
      exerciseName: name,
      sets: Array.from({ length: b.sets }, () => ({ reps: String(b.reps), weight: b.kg ? String(b.kg) : '' }))
    })
  }
  return { title: `${group} ${type.toLowerCase()}`, date: todayISO(), muscleGroups: [group], exercises }
}

function WorkoutLines({ workout }) {
  return (
    <>
      {(workout.exercises || []).map((ex, i) => (
        <div key={i} className="mgp-ex">
          <span className="mgp-ex-name">{ex.exerciseName}</span>
          <span className="mgp-ex-sets">{setsText(ex.sets)}</span>
        </div>
      ))}
    </>
  )
}

export default function MuscleGroupPage({ group, onBack, onStart, onStartDraft }) {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState('Heavy')
  const [showAll, setShowAll] = useState(false)
  const stats = readStats()
  const factor = setsFactor(stats)
  const colour = (GROUP_STYLE[group] || {}).colour || '#9bb0c9'

  useEffect(() => {
    let live = true
    Promise.all([listWorkouts(), listExercises()]).then(([workouts, exercises]) => {
      if (!live) return
      const categoryOf = new Map(exercises.map((e) => [e.id, e.category]))
      const typed = typedWorkouts(workouts, categoryOf).filter((t) => t.groups.includes(group))
      const { best } = buildReference(workouts)
      setData({ typed, exercises, best })
    })
    return () => {
      live = false
    }
  }, [group])

  if (!data) return <div className="empty-state"><p>Loading…</p></div>

  const count = (t) => data.typed.filter((x) => x.type === t).length
  const history = data.typed.filter((x) => x.type === tab)
  const top = topWorkout(data.typed, tab)
  const plan = researchWorkout(tab, group, { exercises: data.exercises, best: data.best, setsFactor: factor })
  const shown = showAll ? history : history.slice(0, 8)

  return (
    <div className="mgp">
      <button className="btn-ghost" onClick={onBack}>
        ← What are you training?
      </button>
      <div className="mgp-head" style={{ '--mg': colour }}>
        <span className="mg-ico"><MuscleIcon name={group} size={26} /></span>
        <div>
          <div className="mgp-title">{group}</div>
          <div className="mgp-sub">{data.typed.length} workout{data.typed.length !== 1 ? 's' : ''} logged</div>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={() => onStart(group)}>
        Start {group} workout
      </button>

      <div className="seg three">
        {TYPES.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setShowAll(false) }}>
            {t} · {count(t)}
          </button>
        ))}
      </div>

      <div className="card mgp-card" style={{ borderColor: TYPE_COLOUR[tab] }}>
        <div className="mgp-label">Your top {tab.toLowerCase()} {group.toLowerCase()} workout</div>
        {top ? (
          <>
            <div className="mgp-big">
              {tab === 'Heavy' ? `${top.topEst} kg` : `${top.volume.toLocaleString('en-GB')} kg`}
              <span>{tab === 'Heavy' ? ' best estimated max' : ' lifted'}</span>
            </div>
            <div className="mgp-meta">{fmtDate(top.date)} · {top.sets} working sets · about {top.medianReps} reps a set · {top.intensity}% of your best</div>
            <WorkoutLines workout={top.workout} />
            <button className="btn btn-secondary mgp-act" onClick={() => onStartDraft(repeatDraft(top.workout))}>
              Repeat this workout
            </button>
          </>
        ) : (
          <div className="mgp-meta">No {tab.toLowerCase()} {group.toLowerCase()} workout logged yet. The research session below is a good one to start with.</div>
        )}
      </div>

      <div className="card mgp-card">
        <div className="mgp-label">Research-backed {tab.toLowerCase()} {group.toLowerCase()} session</div>
        <div className="mgp-meta" style={{ marginTop: 0 }}>{plan.goal}</div>
        {plan.blocks.map((b, i) => (
          <div key={i} className="mgp-block">
            <div className="mgp-block-name">{b.name}{b.note ? <span> · {b.note}</span> : null}</div>
            <div className="mgp-block-line">
              {b.sets} x {b.reps} reps at about {b.pct}% of your max
              {b.kg ? ` = about ${b.kg} kg` : ''} · rest {b.rest}
            </div>
            {b.kg ? <div className="mgp-block-note">Weight from your best on {b.logged}.</div> : <div className="mgp-block-note">Not in your log yet, so start light and find the weight.</div>}
          </div>
        ))}
        <div className="mgp-meta">{plan.totalSets} sets in all. {plan.effort}</div>
        <ul className="mgp-why">
          {plan.evidence.map((e) => <li key={e}>{e}</li>)}
          {factor !== 1 && (
            <li>
              Sets are set to {Math.round(factor * 100)}% of the standard dose for your {stats.experience} training and age {stats.age}
              {ageFactor(stats.age) < 1 ? ', because recovery slows with age' : ''}. Change this under Progress, Your stats.
            </li>
          )}
        </ul>
        <button
          className="btn btn-primary mgp-act"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              onStartDraft(await researchDraft(plan, group, tab))
            } finally {
              setBusy(false)
            }
          }}
        >
          Do this {tab.toLowerCase()} session
        </button>
        <div className="mgp-meta">It opens as a draft you can change before you save. Lifts not in your log yet are added to your exercise list.</div>
      </div>

      <div className="mgp-label" style={{ margin: '14px 2px 6px' }}>{tab} history · {group}</div>
      {history.length === 0 ? (
        <div className="empty-state"><p>No {tab.toLowerCase()} {group.toLowerCase()} workouts yet.</p></div>
      ) : (
        <>
          {shown.map((t) => (
            <div key={t.id} className="card mgp-hist-card">
              <div className="mgp-hist-head">
                <span>{fmtDate(t.date)}</span>
                <span>{t.volume.toLocaleString('en-GB')} kg · {t.sets} sets</span>
              </div>
              <WorkoutLines workout={t.workout} />
              <button className="mgp-again" onClick={() => onStartDraft(repeatDraft(t.workout))}>Repeat this workout</button>
            </div>
          ))}
          {history.length > 8 && !showAll && (
            <button className="btn-ghost" onClick={() => setShowAll(true)}>Show all {history.length}</button>
          )}
        </>
      )}
      <p className="mgp-foot">
        Heavy, Mixed and Volume come from the weight on each set against your best on that lift, not total kilos. The research
        sessions are a guide from group averages, not a prescription.
      </p>
    </div>
  )
}
