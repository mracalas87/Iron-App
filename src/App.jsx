import { useState } from 'react'
import LogWorkout from './components/LogWorkout'
import WorkoutHistory from './components/WorkoutHistory'
import Progress from './components/Progress'

const TABS = [
  { id: 'log', label: 'Log' },
  { id: 'history', label: 'History' },
  { id: 'progress', label: 'Progress' }
]

export default function App() {
  const [tab, setTab] = useState('log')
  const [activeWorkout, setActiveWorkout] = useState(null)

  function handleRepeat(draftWorkout) {
    setActiveWorkout(draftWorkout)
    setTab('log')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="plate-mark" />
          Iron
        </h1>
      </header>

      <main className="app-content">
        {tab === 'log' && (
          <LogWorkout activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} />
        )}
        {tab === 'history' && <WorkoutHistory onRepeat={handleRepeat} />}
        {tab === 'progress' && <Progress />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
