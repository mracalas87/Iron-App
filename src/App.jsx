import { useState } from 'react'
import Home from './components/Home'
import Lift from './components/Lift'
import Plan from './components/Plan'

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'lift', label: 'Lift' },
  { id: 'plan', label: 'Plan' }
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [liftView, setLiftView] = useState('log') // 'log' | 'history' | 'progress'
  const [activeWorkout, setActiveWorkout] = useState(null)

  function openLog() {
    setLiftView('log')
    setTab('lift')
  }

  function handleRepeat(draftWorkout) {
    setActiveWorkout(draftWorkout)
    openLog()
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
        {tab === 'home' && <Home activeWorkout={activeWorkout} onOpenLog={openLog} />}
        {tab === 'lift' && (
          <Lift
            view={liftView}
            setView={setLiftView}
            activeWorkout={activeWorkout}
            setActiveWorkout={setActiveWorkout}
            onRepeat={handleRepeat}
          />
        )}
        {tab === 'plan' && <Plan />}
      </main>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
