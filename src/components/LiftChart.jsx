import { useEffect, useState } from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Cell, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { dailyVolume, syncRunsFromGarminCache } from '../db'

// Bar colours by kind of lifting day (see loadType.js). Blue is kept for the run line.
const TYPE_COLOURS = { Heavy: '#f07a2d', Volume: '#78b000', Mixed: '#1fb5a3' }
const NO_TYPE_COLOUR = '#3a4250'

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
                  <span style={{ color: '#3d6bff' }}>━</span> Run (km)
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={volumeData} margin={{ top: 8, right: hasRuns ? 0 : 8, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#dfe3e8" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#3a4250', fontSize: 10 }}
                  axisLine={{ stroke: '#dfe3e8' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="kg"
                  tick={{ fill: '#3a4250', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                />
                {hasRuns && (
                  <YAxis
                    yAxisId="km"
                    orientation="right"
                    tick={{ fill: '#3d6bff', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    domain={[0, (max) => Math.max(5, Math.ceil(max))]}
                  />
                )}
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #dfe3e8', borderRadius: 8 }}
                  labelStyle={{ color: '#0f1318' }}
                  cursor={{ fill: '#000000', opacity: 0.05 }}
                  formatter={(value, name, item) => {
                    if (name !== 'volume') return [`${value} km`, 'Run']
                    const p = item && item.payload
                    const detail = p && p.loadType ? ` · ${p.loadType}, median ${p.medianReps} reps, ${p.intensity}% of your best` : ''
                    return [`${Number(value).toLocaleString()} kg${detail}`, 'Lifted']
                  }}
                />
                <Bar yAxisId="kg" dataKey="volume" fill="#78b000" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {volumeData.map((d) => (
                    <Cell key={d.date} fill={TYPE_COLOURS[d.loadType] || NO_TYPE_COLOUR} />
                  ))}
                </Bar>
                {hasRuns && (
                  <Line
                    yAxisId="km"
                    dataKey="runKm"
                    type="monotone"
                    stroke="#3d6bff"
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3, fill: '#3d6bff', stroke: '#ffffff', strokeWidth: 1 }}
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
