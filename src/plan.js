// Training plan: Lisbon Marathon (14 Nov 2026), then Ironman 70.3 Cascais (23 Oct 2027).
// All dates are ISO (YYYY-MM-DD). Edit the plan here; the Plan tab and the race
// countdown in config.js read from this file.

export const RACES = [
  {
    id: 'lisbon',
    name: 'Lisbon marathon',
    date: '2026-11-14',
    kind: 'run',
    distanceKm: 42.195,
    goal: 'Your first marathon.',
    pacing: 'Start at 6:15 to 6:30 per km (finish 4:24 to 4:34). Walk the aid stations. Fuel from 45 minutes.'
  },
  {
    id: 'cascais',
    name: 'Ironman 70.3 Cascais',
    date: '2027-10-23',
    kind: 'triathlon',
    distanceKm: null,
    goal: 'Finish uninjured and well. Not racing a time.',
    pacing: 'Realistic finish 7:00 to 7:30. The cut-off is about 8:30.'
  }
]

// Dated phases. `sequence` (optional) names the weeks of a phase in order.
export const PHASES = [
  {
    id: 'marathon-long',
    name: 'Marathon: last long run',
    start: '2026-10-21',
    end: '2026-11-01',
    instruction: 'Long run 18 to 20 km. Keep it easy: heart rate under 148. Then taper.'
  },
  {
    id: 'marathon-taper',
    name: 'Marathon: taper',
    start: '2026-11-02',
    end: '2026-11-08',
    instruction: 'Taper. Long run 10 to 12 km.'
  },
  {
    id: 'marathon-race',
    name: 'Marathon: race week',
    start: '2026-11-09',
    end: '2026-11-14',
    instruction: 'Race week: 6 to 8 km. Race on Saturday 14 Nov. Start at 6:15 to 6:30 per km, walk the aid stations, fuel from 45 minutes.'
  },
  {
    id: 'recovery',
    name: 'Recovery and baseline tests',
    start: '2026-11-15',
    end: '2026-11-30',
    instruction: 'Recover first, then baseline tests: a 400 m swim and a 30 km ride.'
  },
  {
    id: 'base',
    name: 'Base',
    start: '2026-12-01',
    end: '2027-02-28',
    instruction: 'Swim technique. Rides of 25 to 60 km. Checkpoint: a 1,500 m swim and a 60 km ride.'
  },
  {
    id: 'build',
    name: 'Build',
    start: '2027-03-01',
    end: '2027-06-30',
    instruction:
      'Swim up to 2,500 m. Rides of 60 to 85 km, hilly. Road bike by March; first sea swims and the wetsuit by May. Checkpoint: a 1,900 m swim and an 85 km ride in 4 to 4.5 hours.'
  },
  {
    id: 'summer',
    name: 'Summer block',
    start: '2027-07-01',
    end: '2027-08-31',
    instruction:
      'Main block, 7 to 8 sessions a week: 2 weeks ramp-up, 5 peak weeks, 1 easier week. Long rides of 90, 95, 100 and 90 km. Lifting 30 to 40 minutes, light.',
    sequence: [
      { label: 'Ramp-up', weeks: 2 },
      { label: 'Peak', weeks: 5 },
      { label: 'Easier', weeks: 1 }
    ]
  },
  {
    id: 'final',
    name: 'Final weeks',
    start: '2027-09-01',
    end: '2027-10-08',
    instruction: '3 sessions a week. Dress rehearsal on 18 Sep. Last long session on 2 Oct.'
  },
  {
    id: 'taper',
    name: 'Taper',
    start: '2027-10-09',
    end: '2027-10-22',
    instruction: 'Taper. Race on Saturday 23 Oct.'
  },
  {
    id: 'race-day',
    name: 'Race day',
    start: '2027-10-23',
    end: '2027-10-23',
    instruction: 'Ironman 70.3 Cascais today. Finish uninjured and well.'
  }
]

// Month by month swim and ride targets. A dash means the brief sets no target.
export const MONTH_TARGETS = [
  { month: '2026-11', swim: '400 m baseline test, after the 15 Nov recovery', ride: '30 km baseline test', note: 'Lisbon marathon on 14 Nov.' },
  { month: '2026-12', swim: 'Technique', ride: '25 to 60 km' },
  { month: '2027-01', swim: 'Technique', ride: '25 to 60 km' },
  { month: '2027-02', swim: 'Technique. Checkpoint: 1,500 m', ride: '25 to 60 km. Checkpoint: 60 km', note: 'End of base.' },
  { month: '2027-03', swim: 'Build up to 2,500 m', ride: '60 to 85 km, hilly', note: 'Road bike in place by March.' },
  { month: '2027-04', swim: 'Build up to 2,500 m', ride: '60 to 85 km, hilly' },
  { month: '2027-05', swim: 'Up to 2,500 m. First sea swims', ride: '60 to 85 km, hilly', note: 'Wetsuit in place by May.' },
  { month: '2027-06', swim: 'Up to 2,500 m. Checkpoint: 1,900 m', ride: '60 to 85 km, hilly. Checkpoint: 85 km in 4 to 4.5 h', note: 'End of build.' },
  { month: '2027-07', swim: '', ride: 'Long rides 90, 95, 100, 90 km across the peak weeks', note: 'Summer block, 7 to 8 sessions a week. Lifting 30 to 40 min, light.' },
  { month: '2027-08', swim: '', ride: 'Long rides 90, 95, 100, 90 km across the peak weeks', note: 'Summer block: 5 peak weeks and 1 easier week in total.' },
  { month: '2027-09', swim: '', ride: '', note: '3 sessions a week. Dress rehearsal on 18 Sep.' },
  { month: '2027-10', swim: '', ride: '', note: 'Last long session on 2 Oct. Taper from 9 Oct. Race on 23 Oct.' }
]

export const LIFTING_RULES = [
  {
    title: 'Lifting stays',
    text: 'Lifting stays in the plan for mental clarity: 6 to 7am, on your 5-day cycle (shoulders, back, legs, chest, arms) plus an off day with a run.'
  },
  {
    title: 'Tuesday swim',
    text: 'Lift legs, arms, or take the off day. Never chest, back or shoulders on Tuesday or the Monday before.'
  },
  { title: 'Saturday ride', text: 'No legs from Thursday to Saturday.' },
  { title: 'When recovery drifts', text: 'If HRV or resting HR drifts off normal for 3 days, shorten lifting first.' },
  { title: 'Summer block', text: 'Lifting 30 to 40 minutes, light.' }
]

export const GROUND_RULES = [
  { title: 'Easy is easy', text: 'Keep 80% of training easy. Easy means heart rate under 148.' },
  { title: 'Long ride', text: 'Raise the long ride by 10 km at most.' },
  { title: 'Niggles', text: 'A niggle that lasts 3 days means an easy week.' },
  { title: 'Term time', text: '2 sessions a week (swim Tuesday 5 to 6pm, ride Saturday), on top of lifting.' },
  { title: 'School holidays', text: '4 to 6 sessions a week.' },
  { title: 'July and August', text: 'Main block, 7 to 8 sessions a week.' }
]

// ---------- dates ----------
export const localToday = () => new Date().toLocaleDateString('en-CA')

const utc = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
export const daysBetween = (from, to) => Math.round((utc(to) - utc(from)) / 86400000)

export function daysUntil(iso, today = localToday()) {
  return daysBetween(today, iso)
}

// The next race on or after today. After the last race it stays on the last one.
export function nextRace(today = localToday()) {
  return RACES.find((r) => r.date >= today) || RACES[RACES.length - 1]
}

// Where today sits in the plan. state: 'before' | 'active' | 'after'.
export function currentPhase(today = localToday()) {
  const idx = PHASES.findIndex((p) => today >= p.start && today <= p.end)
  if (idx === -1) {
    return { state: today < PHASES[0].start ? 'before' : 'after', phase: null, next: today < PHASES[0].start ? PHASES[0] : null }
  }
  const phase = PHASES[idx]
  const week = Math.floor(daysBetween(phase.start, today) / 7) + 1
  const totalWeeks = Math.ceil((daysBetween(phase.start, phase.end) + 1) / 7)
  let label = null
  if (phase.sequence) {
    let w = week
    for (const s of phase.sequence) {
      if (w <= s.weeks) {
        label = s.label
        break
      }
      w -= s.weeks
    }
  }
  return { state: 'active', phase, week, totalWeeks, daysLeft: daysBetween(today, phase.end), label, next: PHASES[idx + 1] || null }
}

export function monthTarget(today = localToday()) {
  return MONTH_TARGETS.find((m) => m.month === today.slice(0, 7)) || null
}
