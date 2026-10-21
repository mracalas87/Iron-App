import LogWorkout from './LogWorkout'
import WorkoutHistory from './WorkoutHistory'
import Progress from './Progress'

const VIEWS = [
  { id: 'log', label: 'Log' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' }
]

export default function Lift({ view, setView, activeWorkout, setActiveWorkout, onRepeat }) {
  // A workout in progress always shows the editor, whichever view was last open.
  const current = activeWorkout ? 'log' : view
  return (
    <div>
      {!activeWorkout && (
        <div className="seg three">
          {VIEWS.map((v) => (
            <button key={v.id} className={current === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      )}
      {current === 'log' && <LogWorkout activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} />}
      {current === 'history' && <WorkoutHistory onRepeat={onRepeat} />}
      {current === 'progress' && <Progress />}
    </div>
  )
}
