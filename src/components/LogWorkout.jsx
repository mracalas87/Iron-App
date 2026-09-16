import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import WorkoutEditor, { canSaveWorkout, cleanWorkout } from './WorkoutEditor'
import RunLogger from './RunLogger'
import { saveWorkout, dailyVolume, MUSCLE_GROUPS } from '../db'

function todayISO() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function LogWorkout({ activeWorkout, setActiveWorkout, onSaved }) {
  const [draftMuscleGroups, setDraftMuscleGroups] = useState([])
  const [saved, setSaved] = useState(false)
  const [volumeData, setVolumeData] = useState([])
  const [logMode, setLogMode] = useState('strength') // 'strength' | 'run'

  useEffect(() => {
    if (!activeWorkout) {
      dailyVolume(30).then((data) =>
        setVolumeData(data.map((d) => ({ ...d, label: formatDateShort(d.date) })))
      )
    }
  }, [activeWorkout])

  function toggleDraftGroup(group) {
    setDraftMuscleGroups((groups) =>
      groups.includes(group) ? groups.filter((g) => g !== group) : [...groups, group]
    )
  }

  function startWorkout() {
    setActiveWorkout({
      title: draftMuscleGroups.length > 0 ? draftMuscleGroups.join(', ') : 'Workout',
      date: todayISO(),
      muscleGroups: draftMuscleGroups,
      exercises: []
    })
    setDraftMuscleGroups([])
  }

  async function handleEnd() {
    await saveWorkout({
      ...cleanWorkout(activeWorkout),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    })
    setActiveWorkout(null)
    setSaved(true)
    if (onSaved) onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  if (!activeWorkout) {
    const hasVolume = volumeData.some((d) => d.volume > 0)

    return (
      <div>
        <div className="chip-row" style={{ marginBottom: 12 }}>
          <button
            className={`chip${logMode === 'strength' ? ' active' : ''}`}
            onClick={() => setLogMode('strength')}
          >
            Strength
          </button>
          <button className={`chip${logMode === 'run' ? ' active' : ''}`} onClick={() => setLogMode('run')}>
            Run
          </button>
        </div>

        {logMode === 'run' && <RunLogger />}

        {logMode === 'strength' && (
          <>
        <div className="card">
          <div className="field">
            <label>Muscle groups</label>
            <div className="chip-row">
              {MUSCLE_GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`chip${draftMuscleGroups.includes(g) ? ' active' : ''}`}
                  onClick={() => toggleDraftGroup(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={startWorkout} style={{ marginTop: 14 }}>
            Record workout
          </button>
        </div>
        {saved && (
          <p style={{ color: 'var(--pr)', fontSize: 13, textAlign: 'center' }}>
            Workout saved.
          </p>
        )}

        {hasVolume && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last 30 days (kg lifted/day)
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={volumeData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9aa0a6', fontSize: 10 }}
                  axisLine={{ stroke: '#33393f' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#c9f24b' }}
                  cursor={{ fill: '#ffffff', opacity: 0.05 }}
                />
                <Bar dataKey="volume" fill="#c9f24b" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
          </>
        )}
      </div>
    )
  }

  const canEnd = canSaveWorkout(activeWorkout)

  return (
    <div>
      <WorkoutEditor workout={activeWorkout} setWorkout={setActiveWorkout} />
      <button
        className="btn btn-primary"
        disabled={!canEnd}
        onClick={handleEnd}
        style={{ opacity: canEnd ? 1 : 0.4 }}
      >
        End workout &amp; save
      </button>
    </div>
  )
}
