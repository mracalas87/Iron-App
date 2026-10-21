import { useEffect, useState } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Cell, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { dailyVolume, syncRunsFromGarminCache } from '../db'

// Bar colours by kind of lifting day (see loadType.js). Blue is kept for the run line.
const TYPE_COLOURS = { Heavy: '#ff8a4c', Volume: '#c9f24b', Mixed: '#5ad1c0' }
const NO_TYPE_COLOUR = '#9aa0a6'

function formatDateShort(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// Last 30 days: kg lifted per day (coloured by heavy, volume or mixed) and run distance.
export default function LiftChart({ refreshKey }) {
  const [volumeData, setVolumeData] = useState([])

  useEffect(() => {
    syncRunsFromGarminCache()
      .then(() => dailyVolume(30))
      .then((data) => setVolumeData(data.map((d) => ({ ...d, label: formatDateShort(d.date) }))))
  }, [refreshKey])

  const hasLifts = volumeData.some((d) => d.volume > 0)
  const hasRuns = volumeData.some((d) => d.runKm != null)

  return (
    <>
        {(hasLifts || hasRuns) && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Last 30 days
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--chalk-dim)', marginBottom: 6 }}>
              {['Heavy', 'Volume', 'Mixed']
                .filter((t) => volumeData.some((d) => d.volume > 0 && d.loadType === t))
                .map((t) => (
                  <span key={t}>
                    <span style={{ color: TYPE_COLOURS[t] }}>■</span> {t}
                  </span>
                ))}
              {volumeData.some((d) => d.volume > 0 && !d.loadType) && (
                <span>
                  <span style={{ color: NO_TYPE_COLOUR }}>■</span> Other
                </span>
              )}
              {hasRuns && (
                <span>
                  <span style={{ color: '#4c7eff' }}>━</span> Run (km)
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={volumeData} margin={{ top: 8, right: hasRuns ? 0 : 8, left: 0, bottom: 8 }}>
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
                  yAxisId="kg"
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                />
                {hasRuns && (
                  <YAxis
                    yAxisId="km"
                    orientation="right"
                    tick={{ fill: '#4c7eff', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={[0, (max) => Math.max(5, Math.ceil(max))]}
                  />
                )}
                <Tooltip
                  contentStyle={{ background: '#1e2226', border: '1px solid #33393f', borderRadius: 8 }}
                  labelStyle={{ color: '#e8e6e1' }}
                  cursor={{ fill: '#ffffff', opacity: 0.05 }}
                  formatter={(value, name, item) => {
                    if (name !== 'volume') return [`${value} km`, 'Run']
                    const p = item && item.payload
                    const detail = p && p.loadType ? ` · ${p.loadType}, median ${p.medianReps} reps, ${p.intensity}% of your best` : ''
                    return [`${Number(value).toLocaleString()} kg${detail}`, 'Lifted']
                  }}
                />
                <Bar yAxisId="kg" dataKey="volume" fill="#c9f24b" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {volumeData.map((d) => (
                    <Cell key={d.date} fill={TYPE_COLOURS[d.loadType] || NO_TYPE_COLOUR} />
                  ))}
                </Bar>
                {hasRuns && (
                  <Line
                    yAxisId="km"
                    dataKey="runKm"
                    type="monotone"
                    stroke="#4c7eff"
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3, fill: '#4c7eff', stroke: '#14171a', strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
    </>
  )
}
