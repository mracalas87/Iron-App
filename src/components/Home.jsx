import { useEffect, useState } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import LiftChart from './LiftChart'
import { useGarmin } from '../useGarmin'
import { buildReport, ZONES, statusColor } from '../report'
import { ADVICE_ZONES } from '../trainingAdvice'
import { getVitals, trendLabel, round } from '../vitals'
import { loadLocalEntries, buildFeed } from '../activityFeed'
import { syncRunsFromGarminCache } from '../db'

const tooltipStyle = { background: '#ffffff', border: '1px solid #dfe3e8', borderRadius: 8 }

const firstSentence = (s) => (s ? s.split(/(?<=\.)\s/)[0] : s)

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

function shortDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Gauge({ zones, status, position }) {
  return (
    <div className="gauge slim">
      <div className="gauge-track">
        {zones.map((z) => (
          <div
            key={z.key}
            className={`gauge-seg${status === z.key ? ' active' : ''}`}
            style={{ background: z.color, opacity: position == null ? 0.15 : undefined }}
          />
        ))}
      </div>
      {position != null && <div className="gauge-marker" style={{ left: `${position}%` }} />}
      <div className="gauge-labels">
        {zones.map((z) => (
          <span key={z.key} style={status === z.key ? { color: z.color, fontWeight: 700 } : undefined}>
            {z.key}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniTile({ label, value, unit, trend }) {
  return (
    <div className="mini-tile">
      <div className="label">{label}</div>
      <div className="value">
        {value ?? '—'}
        {value != null && unit && <span className="unit">{unit}</span>}
      </div>
      <div className="trend" style={{ color: trend?.color }}>
        {trend?.text || ' '}
      </div>
    </div>
  )
}

function Trend({ title, data, dataKey, color, domain }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="dim-label">{title}</div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#dfe3e8" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#3a4250', fontSize: 10 }} axisLine={{ stroke: '#dfe3e8' }} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#3a4250', fontSize: 11 }} axisLine={false} tickLine={false} width={28} domain={domain} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#0f1318' }} itemStyle={{ color }} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 2 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function KeyCard({ onSave }) {
  const [value, setValue] = useState('')
  return (
    <div className="card">
      <div className="dim-label">Connect Garmin</div>
      <div className="field" style={{ marginBottom: 10 }}>
        <input type="password" placeholder="Garmin access key" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={!value.trim()} onClick={() => onSave(value)}>
        Save
      </button>
    </div>
  )
}

export default function Home({ activeWorkout, onOpenLog }) {
  const garmin = useGarmin()
  const [stats, setStats] = useState(null)
  const [local, setLocal] = useState([])
  const idle = !activeWorkout // recompute after a workout is saved

  // Recompute whenever Garmin data changes or a workout has just been saved.
  useEffect(() => {
    let live = true
    syncRunsFromGarminCache()
      .then(() => Promise.all([buildReport(), loadLocalEntries()]))
      .then(([s, l]) => {
        if (live) {
          setStats(s)
          setLocal(l)
        }
      })
    return () => {
      live = false
    }
  }, [garmin.data, idle])

  const v = getVitals(garmin.data)
  const hasData = v.hasData
  const labels = v.dates.map(shortDate)
  const chart = labels.map((label, i) => ({
    label,
    hrv: v.hrv.values[i],
    rhr: v.restingHR.values[i],
    sleep: v.sleepHours.values[i] != null ? round(v.sleepHours.values[i], 1) : null
  }))
  const feed = buildFeed(garmin.data, local, 5)
  const advice = stats?.advice
  const reasonsLine = stats ? [...stats.reasons, ...(advice?.reasons || [])].slice(0, 2).join(' · ') : ''
  const sleepTrend = trendLabel(v.sleepHours.delta != null ? v.sleepHours.delta * 60 : null, 'min', true)

  return (
    <div>
      {!garmin.accessKey && !hasData ? (
        <KeyCard onSave={garmin.saveKey} />
      ) : (
        <div className="card">
          <div className="status-head">
            <div className="dim-label" style={{ margin: 0 }}>
              Today{garmin.data?.fetchedAt ? ` · synced ${timeAgo(garmin.data.fetchedAt)}` : ''}
            </div>
            <button className="refresh-btn" onClick={garmin.refresh} disabled={garmin.loading || !garmin.accessKey}>
              {garmin.loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
          {garmin.error && <div className="err-line">{garmin.error}</div>}

          {!hasData ? (
            <div className="dim-text" style={{ padding: '10px 0 2px' }}>Tap Refresh to load your Garmin data.</div>
          ) : (
            stats && (
              <>
                <div className="duo">
                  <div>
                    <div className="duo-label">Recovery</div>
                    <div className="duo-value" style={{ color: statusColor(stats.status) }}>{stats.status}</div>
                    <Gauge zones={ZONES} status={stats.status} position={stats.position} />
                  </div>
                  <div>
                    <div className="duo-label">Training</div>
                    <div className="duo-value" style={{ color: ADVICE_ZONES.find((z) => z.key === advice.zone)?.color }}>
                      {advice.zone || '—'}
                    </div>
                    <Gauge zones={ADVICE_ZONES} status={advice.zone} position={advice.position} />
                  </div>
                </div>

                <div className="advice">
                  <div className="advice-headline">{advice.headline}</div>
                  {advice.strength && (
                    <div className="advice-line">
                      <span>Lift</span> {firstSentence(advice.strength)}
                    </div>
                  )}
                  {advice.run && (
                    <div className="advice-line">
                      <span>Run</span> {firstSentence(advice.run)}
                    </div>
                  )}
                  {reasonsLine && <div className="advice-why">{reasonsLine}</div>}
                </div>
              </>
            )
          )}
        </div>
      )}

      {hasData && (
        <div className="mini-row">
          <MiniTile label="HRV" value={round(v.hrv.latest)} unit="ms" trend={trendLabel(v.hrv.delta, 'ms', true)} />
          <MiniTile label="Resting HR" value={round(v.restingHR.latest)} unit="bpm" trend={trendLabel(v.restingHR.delta, 'bpm', false)} />
          <MiniTile label="Sleep" value={v.sleepHours.latest != null ? round(v.sleepHours.latest, 1) : null} unit="h" trend={sleepTrend} />
        </div>
      )}

      <button className="btn btn-primary" style={{ marginBottom: 12 }} onClick={onOpenLog}>
        {activeWorkout ? 'Resume workout' : 'Log workout'}
      </button>

      <LiftChart refreshKey={idle} />

      {feed.length > 0 && (
        <div className="card" style={{ padding: '4px 14px' }}>
          <div className="dim-label" style={{ margin: '10px 0 2px' }}>Recent</div>
          {feed.map((item) => (
            <div className="feed-row" key={item.key}>
              <div style={{ minWidth: 0 }}>
                <span className="feed-title">{item.title}</span>
                <span className="feed-sub"> · {item.subtitle}</span>
              </div>
              <span className="feed-date">{shortDate(item.date)}</span>
            </div>
          ))}
        </div>
      )}

      {stats && hasData && (
        <details className="more">
          <summary>Details</summary>

          {stats.vitalRows.length > 0 && (
            <div className="card">
              <div className="dim-label">Vitals</div>
              {stats.vitalRows.map((row) => (
                <div className="vital-row" key={row.name}>
                  <div>
                    <div className="name">{row.name}</div>
                    {row.detail && <div className="detail">{row.detail}</div>}
                  </div>
                  <div className="figure">
                    <div>{row.figure}</div>
                    {row.trend.text && <div style={{ fontSize: 11, color: row.trend.color, marginTop: 2 }}>{row.trend.text}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <Trend title="HRV (ms)" data={chart} dataKey="hrv" color="#3d6bff" domain={['dataMin - 8', 'dataMax + 8']} />
            <Trend title="Resting HR (bpm)" data={chart} dataKey="rhr" color="#78b000" domain={['dataMin - 3', 'dataMax + 3']} />
            <Trend title="Sleep (h)" data={chart} dataKey="sleep" color="#1fb5a3" domain={[0, 'dataMax + 1']} />
          </div>

          <div className="card">
            <div className="dim-label">Advice in full</div>
            {advice.strength && <div className="detail-line"><span>Lift</span> {advice.strength}</div>}
            {advice.run && <div className="detail-line"><span>Run</span> {advice.run}</div>}
            {advice.tip && <div className="detail-line">{advice.tip}</div>}
            {stats.notes.map((n) => (
              <div className="detail-line" key={n}>{n}</div>
            ))}
            <div className="basis">
              {stats.basis} Rules: sleep 7h or more (AASM/SRS 2015), multi-day HRV and resting-HR trends (Plews 2013), a week of
              running over 1.5x your recent average (Gabbett 2016), hard days followed by easy ones (convention), taper (Bosquet
              2007). Not medical advice.
            </div>
          </div>

          <button className="btn-ghost" style={{ color: 'var(--danger)', display: 'block', margin: '4px auto 0' }} onClick={garmin.forgetKey}>
            Forget access key
          </button>
        </details>
      )}
    </div>
  )
}
