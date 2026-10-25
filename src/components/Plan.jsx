import { useState } from 'react'
import Panel from './Panel'
import {
  RACES,
  MONTH_TARGETS,
  LIFTING_RULES,
  GROUND_RULES,
  RACE_PLANS,
  RUN_GUIDE,
  weekPlan,
  nextRace,
  localToday,
  daysUntil,
  currentPhase,
  monthTarget
} from '../plan'

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatMonth(ym) {
  return new Date(ym + '-01T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

function countdown(days) {
  if (days < 0) return { big: 'Done', small: 'race complete' }
  if (days === 0) return { big: 'Today', small: 'race day' }
  return { big: `${days} day${days !== 1 ? 's' : ''}`, small: `${Math.floor(days / 7)} wk ${days % 7} d` }
}

function RuleList({ rules }) {
  return rules.map((r, i) => (
    <div
      key={r.title}
      style={{ padding: '8px 0', borderBottom: i < rules.length - 1 ? '1px solid var(--border)' : 'none' }}
    >
      <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
      <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginTop: 2, lineHeight: 1.45 }}>{r.text}</div>
    </div>
  ))
}

function Bullets({ lines }) {
  return lines.map((t, i) => (
    <div key={i} style={{ fontSize: 14, lineHeight: 1.5, padding: '6px 0', borderBottom: i < lines.length - 1 ? '1px solid var(--border)' : 'none' }}>
      {t}
    </div>
  ))
}

function MonthRow({ m, current }) {
  return (
    <div
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
        borderLeft: current ? '3px solid var(--iron)' : '3px solid transparent',
        paddingLeft: 10
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: current ? 'var(--iron)' : undefined }}>{formatMonth(m.month)}</div>
      {m.swim && (
        <div style={{ fontSize: 13, marginTop: 3 }}>
          <span style={{ color: 'var(--chalk-dim)' }}>Swim: </span>
          {m.swim}
        </div>
      )}
      {m.ride && (
        <div style={{ fontSize: 13, marginTop: 3 }}>
          <span style={{ color: 'var(--chalk-dim)' }}>Ride: </span>
          {m.ride}
        </div>
      )}
      {m.note && <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: 3 }}>{m.note}</div>}
    </div>
  )
}

export default function Plan() {
  const today = localToday()
  const phase = currentPhase(today)
  const week = weekPlan(today)
  const race = nextRace(today)
  const thisMonth = monthTarget(today)
  const thisMonthKey = today.slice(0, 7)
  const upcomingMonths = MONTH_TARGETS.filter((m) => m.month >= thisMonthKey)
  const [open, setOpen] = useState(null) // which panel is open, or null for the list

  const goHome = () => {
    setOpen(null)
    document.querySelector('.app-content')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }

  const nowSummary =
    phase.state === 'active'
      ? `${phase.phase.name} · week ${phase.week} of ${phase.totalWeeks}`
      : phase.state === 'before'
        ? `Starts ${formatDate(phase.next.start)}`
        : 'Plan complete'
  const targetSummary = thisMonth
    ? [thisMonth.swim && `Swim: ${thisMonth.swim}`, thisMonth.ride && `Ride: ${thisMonth.ride}`].filter(Boolean)[0] || 'Month by month to the race'
    : 'Month by month to the race'
  const back = { open, onToggle: setOpen, onHome: goHome, homeLabel: 'Back to panels' }

  return (
    <div>
      <div className="metric-grid">
        {RACES.map((r) => {
          const c = countdown(daysUntil(r.date, today))
          return (
            <div className="metric-box" key={r.id}>
              <div className="label">{r.name}</div>
              <div className="value">{c.big}</div>
              <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 4 }}>
                {formatDate(r.date)} · {c.small}
              </div>
            </div>
          )
        })}
      </div>

      <Panel id="now" icon="now" title="Now" summary={nowSummary} {...back}>
        {phase.state === 'active' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--mono)' }}>{phase.phase.name}</div>
            <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: 4 }}>
              Week {phase.week} of {phase.totalWeeks}
              {phase.label ? ` · ${phase.label} week` : ''} · {phase.daysLeft} day{phase.daysLeft !== 1 ? 's' : ''} left in this phase
            </div>
            <div style={{ fontSize: 15, marginTop: 12, lineHeight: 1.5 }}>{phase.phase.instruction}</div>
            {phase.next && (
              <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: 12 }}>
                Next: {phase.next.name}, from {formatDate(phase.next.start)}
              </div>
            )}
          </>
        )}
        {phase.state === 'before' && (
          <div style={{ fontSize: 14 }}>The plan starts on {formatDate(phase.next.start)}: {phase.next.name}.</div>
        )}
        {phase.state === 'after' && <div style={{ fontSize: 14 }}>The plan is complete. Well done.</div>}
      </Panel>

      {week && (
        <Panel id="week" icon="week" title="This week" summary={week.km ? `${week.label} · ${week.km}` : week.label} {...back}>
          <Bullets lines={week.sessions} />
        </Panel>
      )}

      {RACE_PLANS[race.id] && (
        <Panel id="raceplan" icon="race" title="Race plan" summary={race.name} {...back}>
          <Bullets lines={RACE_PLANS[race.id]} />
        </Panel>
      )}

      <Panel id="pace" icon="pace" title="Pace and heart rate" summary="Easy under 148 · Marathon 6:15 to 6:30" {...back}>
        {RUN_GUIDE.map((z, i) => (
          <div key={z.name} style={{ padding: '8px 0', borderBottom: i < RUN_GUIDE.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {z.name} <span style={{ fontWeight: 400, color: 'var(--chalk-dim)' }}>· {z.hr} bpm</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginTop: 2 }}>{z.pace}</div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: 'var(--chalk-dim)', marginTop: 8 }}>Estimates from your Garmin runs, not a lab test.</div>
      </Panel>

      <Panel id="targets" icon="swimride" title="Swim and ride targets" summary={targetSummary} {...back}>
        {!(thisMonth && thisMonth.month === thisMonthKey) && (
          <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginBottom: 6 }}>No target set for this month.</div>
        )}
        {upcomingMonths.map((m) => (
          <MonthRow key={m.month} m={m} current={m.month === thisMonthKey} />
        ))}
      </Panel>

      <Panel id="races" icon="race" title="Races" summary={RACES.map((r) => r.name).join(' · ')} {...back}>
        {RACES.map((r, i) => (
          <div key={r.id} style={{ padding: '8px 0', borderBottom: i < RACES.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{r.goal}</div>
            <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginTop: 2, lineHeight: 1.45 }}>{r.pacing}</div>
          </div>
        ))}
      </Panel>

      <Panel id="lifting" icon="lifting" title="Lifting rules" summary={`${LIFTING_RULES.length} rules`} {...back}>
        <RuleList rules={LIFTING_RULES} />
      </Panel>

      <Panel id="ground" icon="rules" title="Ground rules" summary={`${GROUND_RULES.length} rules`} {...back}>
        <RuleList rules={GROUND_RULES} />
      </Panel>
    </div>
  )
}
