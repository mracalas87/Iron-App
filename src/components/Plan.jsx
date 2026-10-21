import {
  RACES,
  MONTH_TARGETS,
  LIFTING_RULES,
  GROUND_RULES,
  localToday,
  daysUntil,
  currentPhase,
  monthTarget
} from '../plan'

function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: 'var(--chalk-dim)',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      {children}
    </div>
  )
}

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
  const thisMonth = monthTarget(today)
  const thisMonthKey = today.slice(0, 7)
  const upcomingMonths = MONTH_TARGETS.filter((m) => m.month >= thisMonthKey)
  const preview = upcomingMonths.slice(0, 2)
  const rest = upcomingMonths.slice(2)

  return (
    <div>
      <div className="metric-grid">
        {RACES.map((race) => {
          const c = countdown(daysUntil(race.date, today))
          return (
            <div className="metric-box" key={race.id}>
              <div className="label">{race.name}</div>
              <div className="value">{c.big}</div>
              <div style={{ fontSize: 11, color: 'var(--chalk-dim)', marginTop: 4 }}>
                {formatDate(race.date)} · {c.small}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <Label>Now</Label>
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
      </div>

      <div className="card">
        <Label>Races</Label>
        {RACES.map((race, i) => (
          <div
            key={race.id}
            style={{ padding: '8px 0', borderBottom: i < RACES.length - 1 ? '1px solid var(--border)' : 'none' }}
          >
            <div style={{ fontSize: 14, fontWeight: 600 }}>{race.name}</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>{race.goal}</div>
            <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginTop: 2, lineHeight: 1.45 }}>{race.pacing}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <Label>Swim and ride targets</Label>
        {thisMonth && thisMonth.month === thisMonthKey ? null : (
          <div style={{ fontSize: 13, color: 'var(--chalk-dim)', marginBottom: 6 }}>No target set for this month.</div>
        )}
        {preview.map((m) => (
          <MonthRow key={m.month} m={m} current={m.month === thisMonthKey} />
        ))}
        {rest.length > 0 && (
          <details style={{ marginTop: 8 }}>
            <summary style={{ fontSize: 13, color: 'var(--chalk-dim)', cursor: 'pointer', padding: '4px 0' }}>
              All months to the race
            </summary>
            {rest.map((m) => (
              <MonthRow key={m.month} m={m} current={false} />
            ))}
          </details>
        )}
      </div>

      <div className="card">
        <Label>Lifting rules</Label>
        <RuleList rules={LIFTING_RULES} />
      </div>

      <div className="card">
        <Label>Ground rules</Label>
        <RuleList rules={GROUND_RULES} />
      </div>
    </div>
  )
}
