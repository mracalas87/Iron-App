import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Dot
} from 'recharts'
import { listExercises, exerciseHistory, sessionMetrics } from '../db'

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function PRDot(props) {
  const { cx, cy, payload } = props
  if (!payload.isPR) return null
  return <Dot cx={cx} cy={cy} r={4} fill="var(--pr, #c9f24b)" stroke="none" />
}

export default function Progress() {
  const [exercises, setExercises] = useState([])
  const [selected, setSelected] = useState(null)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    listExercises().then(setExercises)
  }, [])

  useEffect(() => {
    if (!selected) return
    load()
  }, [selected])

  async function load() {
    const sessions = await exerciseHistory(selected.id) // chronological
    let runningBest = 0
    const data = sessions.map((s) => {
      const { volume, best1RM } = sessionMetrics(s)
      const isPR = best1RM > runningBest
      if (isPR) runningBest = best1RM
      return {
        date: formatDateShort(s.date),
        est1RM: Math.round(best1RM * 10) / 10,
        volume,
        isPR
      }
    })
    setChartData(data)
  }

  if (!selected) {
    return (
      <div>
        {exercises.length === 0 ? (
          <div className="empty-state">
            <div className="mark">—</div>
            <p>Log a few sessions first, then progress charts will appear here.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 4 }}>
            {exercises.map((e) => (
              <button
                key={e.id}
                className="exercise-list-item"
                onClick={() => setSelected(e)}
              >
                <span>{e.name}</span>
                <span className="category">{e.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  const latest = chartData[chartData.length - 1]
  const first = chartData[0]
  const change = latest && first ? latest.est1RM - first.est1RM : 0

  return (
    <div>
      <button className="btn-ghost" onClick={() => setSelected(null)}>
        ← All exercises
      </button>
      <h2 style={{ fontFamily: 'var(--mono)', fontSize: 17, margin: '4px 0 12px' }}>
        {selected.name}
      </h2>

      {chartData.length < 2 ? (
        <div className="empty-state">
          <p>Need at least 2 sessions to chart a trend.</p>
        </div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="metric-box">
              <div className="label">Est. 1RM now</div>
              <div className="value">{latest.est1RM}kg</div>
            </div>
            <div className="metric-box">
              <div className="label">Since first log</div>
              <div className="value" style={{ color: change >= 0 ? 'var(--pr)' : 'var(--danger)' }}>
                {change >= 0 ? '+' : ''}
                {Math.round(change * 10) / 10}kg
              </div>
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Estimated 1RM
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={{ stroke: '#33393f' }} tickLine={false} />
                <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#4c7eff' }}
                />
                <Line
                  type="monotone"
                  dataKey="est1RM"
                  stroke="#4c7eff"
                  strokeWidth={2}
                  dot={<PRDot />}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Session volume (kg lifted)
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#33393f" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={{ stroke: '#33393f' }} tickLine={false} />
                <YAxis tick={{ fill: '#9aa0a6', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  itemStyle={{ color: '#c9f24b' }}
                />
                <Line type="monotone" dataKey="volume" stroke="#c9f24b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
