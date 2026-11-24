// Training plan: recovery and a VO2 max block, then the build to Ironman 70.3 Cascais (23 Oct 2027).
// All dates are ISO (YYYY-MM-DD). Edit the plan here; the Plan tab and the race
// countdown in config.js read from this file.

export const RACES = [
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
    id: 'recovery',
    name: 'Recovery and baseline tests',
    start: '2026-11-15',
    end: '2026-11-30',
    instruction: 'Recover first. The 400 m swim baseline is done (17 Nov, 9:56). There is no bike yet, so the 30 km ride baseline waits for January.',
    liftNote: 'Recovering: lift light and stop well short of failure.',
    legsNote: 'Legs: half the usual sets.'
  },
  {
    id: 'vo2',
    name: 'VO2 max block',
    start: '2026-12-01',
    end: '2027-01-17',
    instruction:
      'Goal: raise VO2 max from about 49 toward 55 by mid-January (51 to 53 is the realistic range). Two hard runs a week (Wednesday and Friday): 1 km warm-up, the Norwegian 4 x 4 (four 4-minute efforts at heart rate 165 to 175 with 3 minutes easy between), 1 km cool-down. These two runs are your only runs: no easy, recovery or long runs in between. Test run on Fri 15 Jan. Track progress in the VO2 score panel.',
    liftNote: 'Lift as normal. On a VO2 day lift upper body, or skip legs.',
    legsNote: 'Legs: none the day before a VO2 run or on the day itself.'
  },
  {
    id: 'base',
    name: 'Base',
    start: '2027-01-18',
    end: '2027-02-28',
    instruction: 'One swim a week building to a 1,500 m checkpoint on 23 Feb. Rides of 25 to 60 km. Checkpoint: a 1,500 m swim and a 60 km ride.',
    liftNote: 'Muscle phase: lift as normal while swim and ride stay at the minimum.'
  },
  {
    id: 'build',
    name: 'Build',
    start: '2027-03-01',
    end: '2027-06-30',
    instruction:
      'Swim up to 2,500 m. Rides of 60 to 85 km, hilly. Road bike by March; first sea swims and the wetsuit by May. Checkpoint: a 1,900 m swim and an 85 km ride in 4 to 4.5 hours.',
    liftNote: 'Keep upper body heavy.',
    legsNote: 'Legs: about 30% fewer sets.'
  },
  {
    id: 'summer',
    name: 'Summer block',
    start: '2027-07-01',
    end: '2027-08-31',
    instruction:
      'Main block, 7 to 8 sessions a week: 2 weeks ramp-up, 5 peak weeks, 1 easier week. Long rides of 90, 95, 100 and 90 km. Lifting 30 to 40 minutes, light.',
    liftNote: 'Keep lifting to 30 to 40 minutes and light.',
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
    instruction: '3 sessions a week. Dress rehearsal on 18 Sep. Last long session on 2 Oct.',
    liftNote: 'Maintenance: about 30 minutes, heavy, few sets.',
    legsNote: 'Legs: light.'
  },
  {
    id: 'taper',
    name: 'Taper',
    start: '2027-10-09',
    end: '2027-10-22',
    instruction: 'Taper. Race on Saturday 23 Oct.',
    liftNote: 'Taper: same weights, half the sets, nothing new.',
    legsNote: 'No heavy legs this week.'
  },
  {
    id: 'race-day',
    name: 'Race day',
    start: '2027-10-23',
    end: '2027-10-23',
    instruction: 'Ironman 70.3 Cascais today. Finish uninjured and well.'
  }
]

// ---------- coaching: what each week looks like ----------
// Built from Andy's Garmin history (Feb to Nov 2026): VO2 max 47 rising to 49, 5K 21:51, 10K 45:45.

// Dated weeks (Monday to Sunday) for the recovery and the VO2 block.
export const WEEKS = [
  {
    start: '2026-11-22',
    end: '2026-11-30',
    label: 'Baseline tests',
    km: '12 to 16 km running',
    sessions: [
      'Swim baselines are done: 400 m in 9:56 on Tue 17 Nov (about 2:29 per 100 m) and 500 m in 12:22 on Tue 24 Nov (about 2:28 per 100 m), heart rate 117. The swim plan starts on Tue 1 Dec.',
      'No bike until the end of December, so there are no rides in the plan yet.',
      'No runs this week: the VO2 block, two runs a week, starts on Wed 2 Dec.'
    ]
  },
  {
    start: '2026-12-01',
    end: '2026-12-06',
    label: 'VO2 week 1',
    km: 'about 13 km running (two runs)',
    sessions: [
      'Wed 2 Dec: 3 x 4 min hard (the on-ramp), 3 min easy jog between. Fri 4 Dec: the full 4 x 4.',
      'Nothing else is planned: one swim and two runs a week, plus lifting.',
      'No legs the day before a VO2 run or on the day. Skip or cut a session if the legs feel heavy, your heart rate will not climb, or HRV is well below about 110.'
    ]
  },
  {
    start: '2026-12-07',
    end: '2026-12-13',
    label: 'VO2 week 2',
    km: 'about 14 km running (two runs)',
    sessions: [
      'Wed 9 Dec and Fri 11 Dec: 4 x 4 min hard, 3 min easy jog between.',
      'Those are your only two runs. Eat enough carbohydrate on the hard days.'
    ]
  },
  {
    start: '2026-12-14',
    end: '2026-12-20',
    label: 'VO2 week 3',
    km: 'about 14 km running (two runs)',
    sessions: [
      'Wed 16 Dec and Fri 18 Dec: 4 x 4 min hard, 3 min easy jog between. School is out from here, but it stays at two runs a week: the extra time goes into rest and sleep.',
      'Keep sleep above 7 hours.'
    ]
  },
  {
    start: '2026-12-21',
    end: '2026-12-27',
    label: 'VO2 week 4 (Christmas)',
    km: 'about 14 km running (two runs)',
    sessions: [
      'Wed 23 Dec: 4 x 4 min hard. Sat 26 Dec: 4 x 4 min hard (Friday is Christmas, so the second session moves to Saturday).',
      'Fri 25 Dec: rest or a walk. Wednesday has a mid-block check: use the VO2 score panel to compare with the baseline.'
    ]
  },
  {
    start: '2026-12-28',
    end: '2027-01-03',
    label: 'VO2 week 5 (New Year)',
    km: 'about 14 km running (two runs)',
    sessions: [
      'Wed 30 Dec: 4 x 4 min hard. Sat 2 Jan: 4 x 4 min hard (Friday is New Year, so the second session moves to Saturday).',
      'Sun 3 Jan: rest. Long runs start the week after, once the hard sessions are done for the week.',
      'Skip or cut a session if the legs feel heavy, your heart rate will not climb, or HRV is well below about 110.'
    ]
  },
  {
    start: '2027-01-04',
    end: '2027-01-10',
    label: 'VO2 week 6',
    km: 'about 21 km running (two VO2 runs and an 8 km long run)',
    sessions: [
      'Wed 6 Jan: the full 4 x 4 min hard. Fri 8 Jan: 3 x 4 min hard (a lighter day to freshen up for the test).',
      'Sat 9 Jan: the bike is back, so the 30 km baseline ride, steady, heart rate under 145 (zone 2).',
      'Sun 10 Jan: the first long run, 8 km easy, heart rate under 148. The week before it is only two runs, so the long run starts short and builds by 2 km at a time.',
      'Lift as normal, no legs the day before a VO2 run or the day before and after a long run.'
    ]
  },
  {
    start: '2027-01-11',
    end: '2027-01-17',
    label: 'Test week',
    km: 'about 12 km running (the opener and the test)',
    sessions: [
      'Wed 13 Jan: a short opener, 2 x 4 min hard, to keep the legs fresh for the test.',
      'Fri 15 Jan: the test run. 10 min easy, then 20 to 25 min as hard as you can hold evenly, outdoors with a good heart rate signal. The watch updates your VO2 max after a run like this. Also log the session in the VO2 score panel (Plan tab).',
      'Sat 16 Jan: rest or an easy ride. Sun 17 Jan: rest or an easy walk, no long run two days after the test. The base phase starts on Mon 18 Jan, with long runs on Sundays: 10 km on 24 Jan, 12 km on 31 Jan.'
    ]
  }
]

// The Norwegian 4 x 4 (four 4-minute efforts at 90 to 95% of max heart rate, 3 minutes easy between).
const VO2_4X4 =
  'VO2 4 x 4 min: 1 km easy warm-up, then 4 x 4 min hard at heart rate 165 to 175 (zone 4-5, in zone 5 by the second minute), 3 min easy jog between at heart rate 130 to 140, 1 km easy cool-down. About 7 km, uphill or flat. Upper body only if you lift. TARGET for a VO2 score of 50: 4:02 per km on every hard effort (0.99 km in 4 min) at heart rate about 174. Hit it on every effort and the next target is 3:58 per km. Baseline 22 Nov: 4:08 per km'
const VO2_3X4 =
  'VO2 3 x 4 min: 1 km easy warm-up, then 3 x 4 min hard at heart rate 165 to 175 (zone 4-5, in zone 5 by the second minute), 3 min easy jog between at heart rate 130 to 140, 1 km easy cool-down. About 6 km, uphill or flat. Upper body only if you lift. TARGET for a VO2 score of 50: 4:02 per km on every hard effort (0.99 km in 4 min) at heart rate about 174. Hit it on every effort and the next target is 3:58 per km'

// The run planned for a date: distance and heart rate zone. Zones are Andy's own: zone 1 100 to 132,
// zone 2 133 to 148, zone 3 149 to 159, zone 4 160 to 170, zone 5 171 and up.
export const RUN_SESSIONS = {
  // The VO2 max block: the Norwegian 4 x 4 on Wednesday and Friday (Tuesday is the swim, Saturday the ride).
  // These are the only runs: two a week, no easy or recovery runs in between.
  '2026-12-02': 'VO2 on-ramp, 3 x 4 min: 1 km easy warm-up, then 3 x 4 min hard at heart rate 165 to 175 (zone 4-5, in zone 5 by the second minute), 3 min easy jog between at heart rate 130 to 140, 1 km easy cool-down. About 6 km, uphill or flat. Upper body only if you lift. TARGET for a VO2 score of 50: 4:02 per km on every hard effort (0.99 km in 4 min) at heart rate about 174. Hit it on every effort and the next target is 3:58 per km',
  '2026-12-04': VO2_4X4,
  '2026-12-09': VO2_4X4,
  '2026-12-11': VO2_4X4,
  '2026-12-16': VO2_4X4,
  '2026-12-18': VO2_4X4,
  '2026-12-23': VO2_4X4,
  '2026-12-26': VO2_4X4,
  '2026-12-30': VO2_4X4,
  '2027-01-02': VO2_4X4,
  '2027-01-06': VO2_4X4,
  '2027-01-08': VO2_3X4,
  '2027-01-10': 'Long run 8 km, easy, heart rate under 148 (zone 2). The first long run since the marathon: walk the hills if you need to, there is no time target',
  '2027-01-13': 'VO2 opener, 2 x 4 min: 1 km easy warm-up, then 2 x 4 min hard at heart rate 165 to 175 (zone 4-5), 3 min easy jog between at heart rate 130 to 140, 1 km easy cool-down. About 5 km. It keeps the legs fresh for the test on Friday',
  '2027-01-15': 'VO2 test run: 10 min easy, then 20 to 25 min as hard as you can hold evenly, outdoors, good heart rate signal, then 5 min easy. About 7 km. The watch updates your VO2 max after it',
  '2027-01-24': 'Long run 10 km, easy, heart rate under 148 (zone 2)',
  '2027-01-31': 'Long run 12 km, easy, heart rate under 148 (zone 2)'
}

// The rules Andy can change in the Plan tab (settings.js keeps his choices; report.js applies them).
// spacingDays: the same lift is not suggested again within this many days. restAfter: an off day after this
// many lifting days in a row. legsBuffer: days legs stay clear before and after a long run. longRunKm: how
// long a run counts as a long run. keyRunNoLift: no lifting on a race-rhythm run day. activeLifts: which lifts are
// in the rotation (0 shoulders, 1 back, 2 legs, 3 chest, 4 arms), so a 4-day cycle drops one. custom: his own rules,
// in words, for the coach.
export const DEFAULT_RULES = { spacingDays: 5, restAfter: 5, legsBuffer: 2, longRunKm: 15, keyRunNoLift: true, activeLifts: [0, 1, 2, 3, 4], custom: '' }
let activeRules = { ...DEFAULT_RULES }
export function setRules(rules) {
  activeRules = { ...DEFAULT_RULES, ...(rules || {}) }
}
export function getRules() {
  return activeRules
}

// Planned runs Andy has moved to another day (the "Do today" button in Coming up): { fromDate: toDate }.
// A move only counts for a dated session, and only if the new day has no session of its own.
let activeMoves = {}
export function setMoves(moves) {
  activeMoves = moves || {}
}
export function getMoves() {
  const out = {}
  for (const [from, to] of Object.entries(activeMoves)) {
    if (from in RUN_SESSIONS && !(to in RUN_SESSIONS) && from !== to) out[from] = to
  }
  return out
}
// The dated runs as they stand now, moves applied.
export function getSessions() {
  const out = { ...RUN_SESSIONS }
  for (const [from, to] of Object.entries(getMoves())) {
    out[to] = RUN_SESSIONS[from]
    delete out[from]
  }
  return out
}

const addIso = (iso, n) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// A missed easy run is simply dropped, but the key session before the race (the race-rhythm run) is not:
// if it was missed in the last 3 days it carries to the first free day from today, as long as that is at
// least 8 days before the race (after that the taper matters more than the session). A run done
// around its day, up to 2 days early or any time since, counts as done. Returns the sessions with it
// carried, and which dates were carried from where: { sessions, carried: { newDate: oldDate } }.
export function carryMissed(sessions, runs, today = localToday()) {
  const out = { ...sessions }
  const carried = {}
  const race = nextRace(today)
  const lastDay = race ? addIso(race.date, -8) : null
  for (const [d, text] of Object.entries(sessions)) {
    if (!text.startsWith('Race rhythm') || d >= today || daysBetween(d, today) > 3 || !lastDay) continue
    const km = sessionKm(text)
    const done = (runs || []).some((r) => r.date >= addIso(d, -2) && r.date <= today && km != null && r.distanceKm >= 0.75 * km)
    if (done) continue
    let to = today
    while ((to in out || RACES.some((r) => r.date === to)) && to <= lastDay) to = addIso(to, 1)
    if (to > lastDay) continue
    out[to] = text
    delete out[d]
    carried[to] = d
  }
  return { sessions: out, carried }
}

// Distance in km at the low end of a planned run ("Easy 6 to 8 km" is 6, "Optional 5 km" is 5).
const sessionKm = (text) => {
  const m = (text || '').match(/(\d+(?:\.\d+)?)(?: to \d+(?:\.\d+)?)? km/)
  return m ? Number(m[1]) : null
}

// Planned runs already done early. If Andy swaps days and runs a day or two before a planned run,
// that run counts for it (at least three quarters of its distance), so it is not asked for again.
// Returns the set of planned dates that are done. runs: [{ date, distanceKm }].
export function doneEarly(runs, today = localToday()) {
  const sessions = getSessions()
  const planned = Object.keys(sessions).filter((d) => d >= today).sort()
  const done = new Set()
  const recent = (runs || [])
    .filter((r) => r.date <= today && daysBetween(r.date, today) <= 2)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const r of recent) {
    // a run on its own planned day is just that run
    const own = sessionKm(sessions[r.date])
    if (own != null && r.distanceKm >= 0.75 * own) continue
    const match = planned.find((d) => {
      const gapDays = daysBetween(r.date, d)
      const km = sessionKm(sessions[d])
      return !done.has(d) && gapDays >= 1 && gapDays <= 2 && km != null && r.distanceKm >= 0.75 * km
    })
    if (match) done.add(match)
  }
  return done
}

// Dated tests and checkpoints that are not runs; the Plan line on Today points to the next one.
export const MILESTONES = [
  { date: '2026-11-17', text: '400 m swim baseline done: 9:56, about 2:29 per 100 m' },
  { date: '2027-01-09', text: '30 km baseline ride (the bike arrives at the end of December)' },
  { date: '2026-12-23', text: 'VO2 mid-block check: log the 4 x 4 in the VO2 score panel and compare with the 22 Nov baseline (49)' },
  { date: '2027-01-15', text: 'VO2 max test run (goal: VO2 score toward 55, Garmin over 50)' },
  { date: '2027-02-23', text: 'swim checkpoint: 1,500 m continuous, timed' },
  { date: '2027-02-27', text: 'base checkpoint: 60 km ride' },
  { date: '2027-06-26', text: 'build checkpoint: 1,900 m swim and 85 km ride' },
  { date: '2027-09-18', text: 'dress rehearsal' },
  { date: '2027-10-02', text: 'last long session' }
]

// Between these dates every run is spelled out in RUN_SESSIONS (or the long-run slot), so a day with
// no run there means no run, and no extra easy run is added on off days.
export const DATED_RUNS_FROM = '2026-11-15'
// Two VO2 runs a week until the test, and a Sunday long run from 10 Jan. Nothing else is added: no easy or recovery runs, and
// no runs after the January long runs until the next block is planned. The window runs to race eve so the generic phase text
// (easyRunText, the phase weeks) can never turn into a suggested run: only runs dated in RUN_SESSIONS appear.
export const DATED_RUNS_UNTIL = '2027-10-22'

// An easy run on an off day, by phase, when no dated run is planned.
export function easyRunText(phaseId) {
  const hr = 'heart rate under 148 (zone 2)'
  return (
    {
      base: `Easy 6 to 9 km (40 to 60 min), ${hr}`,
      build: `Easy 7 to 11 km (45 to 75 min), ${hr}`,
      summer: `Easy 6 to 8 km, ${hr}`,
      final: `Easy 5 to 6 km, ${hr}`,
      taper: `Easy 4 to 5 km, ${hr}`
    }[phaseId] || `Easy 5 to 6 km, ${hr}`
  )
}

// A typical week for each longer phase, used once the dated weeks run out.
export const PHASE_WEEKS = {
  base: [
    'Tue 5 to 6pm: swim for technique, 30 to 40 minutes of drills and easy lengths (about 800 to 1,200 m, heart rate under 135). Book a few lessons or a video check in the first month.',
    'Sat: long easy ride, 25 to 60 km, adding 5 to 10 km a month. Keep heart rate under about 140 on the bike until you have measured it.',
    'Sun: long easy run, heart rate under 148: 10 km on 24 Jan, 12 km on 31 Jan. No other runs are planned until the next block is set.'
  ],
  build: [
    'Tue: swim, building to 2,500 m a session (drills, then steady sets, heart rate under 140). First sea swims in May, in the wetsuit.',
    'Sat: long ride of 60 to 85 km, hilly, 10 km longer than the last at most. From May, one ride a month ends with a 15 minute easy run.',
    'Runs: not planned yet. Set the next run block before March; until then Today shows no run.',
    'Keep 80% of it easy. One short hard effort a week is plenty.'
  ],
  summer: [
    'Each week: 2 swims, 2 rides (one long), 2 runs and 1 brick (ride then run), plus 30 to 40 minutes of light lifting.',
    'Peak weeks: long rides of 90, 95, 100 and 90 km at heart rate under 145 (zone 2). After one a week, run 5 to 8 km easy straight off the bike.',
    'Easier week: cut everything by about a third.',
    'Practise race fuelling on every long ride: 60 to 90 g of carbohydrate an hour.'
  ],
  final: [
    'Three sessions a week: one swim, one ride, one run, at race effort in short blocks.',
    'Sat 18 Sep dress rehearsal: sea swim 1.9 km, ride 60 to 70 km, run 5 km. Race kit, race food.',
    'Last long session Sat 2 Oct. After that nothing new.'
  ],
  taper: [
    'Cut volume by about 40% the first week and 60% the second. Keep a few short efforts at race pace.',
    'Mon of race week: equipment check (tyres, gears, goggles, wetsuit fit). Fri: rack the bike, rest.',
    'Lifting: same weights, half the sets, nothing new. No heavy legs in the last 7 days.'
  ]
}

export const RACE_PLANS = {
  cascais: [
    'Swim: calm and wide at the start, no sprint. Set the pace from your 1,900 m checkpoint.',
    'Bike: easy-steady, heart rate under about 145. Eat 60 to 90 g of carbohydrate an hour from the first 15 minutes.',
    'Run: first 3 km at 6:20 to 6:40 per km whatever your heart rate says, then settle. Walk the aid stations.',
    'Finish 7:00 to 7:30; the cut-off is about 8:30.'
  ]
}

// Heart rate and pace guide for running, from Andy's set zones and his own runs.
export const RUN_GUIDE = [
  { name: 'Easy', hr: 'under 148', pace: 'about 6:00 to 6:50 per km on your recent runs' },
  { name: 'Steady', hr: '149 to 159', pace: 'about 5:20 to 5:50 per km' },
  { name: 'Threshold', hr: '160 to 170', pace: 'about 4:35 to 5:00 per km (10K was 45:45)' },
  { name: 'Hard', hr: '171 and up', pace: 'short efforts only' }
]

// Month by month swim and ride targets. A dash means the brief sets no target.
export const MONTH_TARGETS = [
  { month: '2026-11', swim: '400 m baseline done 17 Nov (9:56)', ride: '' },
  { month: '2026-12', swim: 'One swim a week, Tuesday: 700 m building to 1,000 m', ride: '', note: 'No bike until the end of December. VO2 max block: Norwegian 4 x 4 on Wednesday and Friday (Christmas and New Year week: Wednesday and Saturday). Check on 23 Dec.' },
  { month: '2027-01', swim: 'Tuesday: 1,000 m building to 1,300 m', ride: '25 to 60 km', note: 'The bike arrives at the end of December: 30 km baseline ride on Sat 9 Jan. Long runs on Sunday from 10 Jan (8 km, then 10 and 12 km after the test). VO2 block to the test run on Fri 15 Jan. Goal: VO2 score toward 55 (51 to 53 realistic). Base phase from 18 Jan.' },
  { month: '2027-02', swim: 'Tuesday: 1,300 m, then the 1,500 m checkpoint on 23 Feb', ride: '25 to 60 km. Checkpoint: 60 km', note: 'End of base.' },
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
  { title: 'Saturday ride', text: 'No legs from Thursday to Saturday, from the day the bike is back (9 Jan).' },
  { title: 'When recovery drifts', text: 'If HRV or resting HR drifts off normal for 3 days, shorten lifting first.' },
  {
    title: 'Heavy, fewer sets',
    text: 'Heavy loads keep muscle; volume is what costs recovery. In race phases keep the weight and trim sets, legs first.'
  },
  { title: 'Hard sessions apart', text: 'Keep hard runs, rides and leg days on different days, or at least 6 hours apart.' },
  { title: 'Summer block', text: 'Lifting 30 to 40 minutes, light.' }
]

export const GROUND_RULES = [
  { title: 'Easy is easy', text: 'Keep 80% of training easy. Easy means heart rate under 148.' },
  { title: 'Long ride', text: 'Raise the long ride by 10 km at most.' },
  { title: 'Niggles', text: 'A niggle that lasts 3 days means an easy week.' },
  { title: 'Term time', text: 'One swim a week (Tuesday, 5 to 6pm) and two runs, plus a Saturday ride once the bike arrives in January, on top of lifting.' },
  { title: 'School holidays', text: '4 to 6 sessions a week.' },
  { title: 'July and August', text: 'Main block, 7 to 8 sessions a week.' },
  {
    title: 'Thursday family swim',
    text: 'A light swim with your daughter is just for fun and is not in the plan. The only swim in the plan is Tuesday.'
  }
]

// A light swim with his daughter every Thursday, from the first Thursday after the race block
// started. It is easy, short and for fun, so it counts as practice in the water, not training load.
export const FAMILY_SWIM = {
  from: '2026-10-29',
  text: 'Light swim with your daughter, 20 to 30 min (about 400 to 600 m), play first, heart rate under 130'
}

// The one structured swim a week, Tuesday 5 to 6pm, building from the baselines: 400 m in 9:56 on 17 Nov and 500 m in
// 12:22 on 24 Nov, both about 2:28 per 100 m at a heart rate of about 118 (wrist heart rate reads low in the pool, so the
// effort is by feel). About 100 m more each week, with an easier retest week every fourth week, to a 1,500 m checkpoint on
// 23 Feb. Paces creep down about 1 second per 100 m a month: the distance and a relaxed stroke matter more than the clock.
// If Tuesday is missed the same session moves to Thursday (upcoming.js).
const swWarm = (m = 100) => ({ m, t: `${m} m easy warm-up` })
const swCool = (m = 100) => ({ m, t: `${m} m easy cool-down` })
const swDrills = (n) => ({ m: n * 50, t: `${n} x 50 m drills (fingertip drag, then catch-up), 20 s rest` })
const swSets = (reps, m, pace, rest) => ({ m: reps * m, t: `${reps} x ${m} m at about ${pace} per 100 m, ${rest} s rest` })
const swSteady = (m, pace) => ({ m, t: `${m.toLocaleString('en-GB')} m continuous at about ${pace} per 100 m` })
const swTimed = (m, text) => ({ m, t: text })
function swimSession(focus, parts) {
  const total = parts.reduce((sum, p) => sum + p.m, 0)
  return `Swim ${total.toLocaleString('en-GB')} m: ${parts.map((p) => p.t).join(', then ')}. ${focus} Heart rate under 140 (zone 2), by feel`
}
export const SWIM_SESSIONS = {
  '2026-12-01': swimSession('Long, relaxed strokes, breathe every third stroke.', [swWarm(), swSets(2, 250, '2:30', 30), swCool()]),
  '2026-12-08': swimSession('Hold a long reach on every stroke.', [swWarm(), swSteady(400, '2:28'), swDrills(4), swCool()]),
  '2026-12-15': swimSession('Same pace on every repeat.', [swWarm(), swSets(3, 200, '2:27', 20), swDrills(2), swCool()]),
  '2026-12-22': swimSession('Easier week and a retest of your 24 Nov swim.', [swWarm(), swTimed(500, 'timed 500 m continuous, steady. Beat 12:22 (about 2:28 per 100 m) only if it feels easy'), swCool()]),
  '2026-12-29': swimSession('Settle in on the first repeat and hold it.', [swWarm(), swSets(2, 400, '2:27', 30), swCool()]),
  '2027-01-05': swimSession('Count your strokes per length and keep it steady.', [swWarm(), swSteady(600, '2:27'), swDrills(4), swCool()]),
  '2027-01-12': swimSession('Aim for even splits on the three repeats.', [swWarm(), swSets(3, 300, '2:26', 30), swCool()]),
  '2027-01-19': swimSession('Easier week and a retest of your 17 Nov swim.', [swWarm(), swDrills(4), swTimed(400, 'timed 400 m continuous. Beat 9:56 (about 2:29 per 100 m) only if it feels easy'), swCool()]),
  '2027-01-26': swimSession('Long and smooth, no sprinting at the walls.', [swWarm(), swSteady(800, '2:26'), swDrills(2), swCool()]),
  '2027-02-02': swimSession('Two long repeats at the same pace.', [swWarm(), swSets(2, 500, '2:25', 30), swCool()]),
  '2027-02-09': swimSession('A long steady swim, then drills to tidy the stroke.', [swWarm(), swSteady(1000, '2:26'), swDrills(2), swCool()]),
  '2027-02-16': swimSession('Last build before the checkpoint: relaxed and steady.', [swWarm(), swSteady(1000, '2:26'), swCool()]),
  '2027-02-23': swimSession('Checkpoint. Go out easy and hold an even pace.', [swWarm(), swTimed(1500, 'timed 1,500 m continuous at about 2:25 to 2:30 per 100 m (36:15 to 37:30 for the 1,500 m)'), swCool()])
}

// How the app decides what to suggest. This is the list the schedule, the Today advice and the coach all
// follow, kept here in plain words so it can be read in the Plan tab.
export const APP_RULES = [
  { title: 'Which lift is next', text: 'The lift that has gone longest without being done (shoulders, back, legs, chest, arms). The same lift is never suggested twice within 5 days. After 5 lifting days in a row there is an off day.' },
  { title: 'Reading your workouts', text: 'The first muscle in the title is the day\'s lift. Triceps or biceps added to another muscle are extras, so "Chest, Triceps" counts as chest. Each lift flips between a heavy day and a volume day.' },
  { title: 'Legs', text: 'Never in the 2 days before or after a run of 15 km or more, never in the 7 days before a race. From the day the bike is back (9 Jan): no legs Thursday to Saturday (the ride). Tuesday is legs, arms or off only (the swim). No legs the day before a VO2 run or on the day, and none the day before, the day of and the day after a long run.' },
  { title: 'VO2 block', text: 'From 2 Dec to 15 Jan: two runs a week, both hard, on Wednesday and Friday (1 km warm-up, the Norwegian 4 x 4, 1 km cool-down), and a test run on 15 Jan. There are no easy, recovery or long runs in between. If recovery is only fair the session is cut to 3 x 4 min, and if the trend is down it becomes an easy run.' },
  { title: 'Two runs a week', text: 'Until the 15 Jan test the only runs are the two VO2 sessions a week, and from 10 Jan a long run on Sunday as well (8 km, none on 17 Jan after the test, then 10 and 12 km). The app never adds an easy or recovery run on an off day, and on every other day Today says there is no run planned. After 31 Jan nothing is planned until the next block is set; the app will not make up runs in the meantime.' },
  { title: 'The swim', text: 'One structured swim a week on Tuesday, 5 to 6pm, building from your baseline (400 m in 9:56 on 17 Nov, 500 m in 12:22 on 24 Nov, about 2:28 per 100 m) to 1,500 m continuous on Tue 23 Feb. If Tuesday is missed, the same session moves to Thursday. There is no other swim in the plan.' },
  { title: 'Days with no lifting', text: 'The long-run day, a race-rhythm run day, and the two days before a race. A full rest day has no lifting and no run.' },
  { title: 'Easy means easy', text: 'Easy running is heart rate under 148 (zone 2), and about 80% of training stays easy. The day after a long run is rest or 30 minutes under 140. After heavy legs, keep the run to 5 to 6 km.' },
  { title: 'The long run', text: 'It goes on the first weekend day at least 3 days after your last legs session and 4 days after another run of 15 km or more. A run of 18 km or more counts as the last long run.' },
  { title: 'Runs done early', text: 'A run done up to 2 days before a planned one counts for it, if it is at least three quarters of the distance. Moving a run to another day makes the day it left a full rest day.' },
  { title: 'Recovery bar', text: 'Starts at the top and loses a step for short sleep (the last 7 nights), your own HRV and resting HR trend below, and a low Garmin HRV status. Garmin\'s "Unbalanced" only counts when your own last 5 days of HRV are also below your normal, because its label is a 7-day average that one odd night or a race can tip. A night under 3 hours is treated as the watch missing the night. Training is the same bar after your recent load: heavy days in a row, a big week of running, no rest day in 14 days.' },
  { title: 'Recovery trends', text: 'Your last 5 days (the median, so one odd reading cannot drag it) against your own 4-week normal: resting HR 3 or more bpm up for 2 days, HRV 12% or more down for 3 days (or about 8% down across the 5 days), a run of short nights or a week of sleep debt, and resting HR up with HRV down together. A trend you can see cuts sets by a third, then 40% with easy short runs and no legs for 2 days, and at the worst a rest day tomorrow.' },
  { title: 'Weights and runs', text: 'Morning weights are found from a raised heart-rate block, kept apart from runs. Runs, swims and rides come from Garmin when you refresh. A run with no lift found that day counts as your run day.' },
  { title: 'The coach', text: 'It reads all of this and your latest data after each refresh. It can lighten the day, move a planned run, add a rest day or leave a note, and every change shows with an Undo. It cannot add training or break these rules.' }
]

// The weekday lifting rules start once swim and ride sessions begin (after the 15 Nov recovery).
export const SWIM_RIDE_FROM = '2026-11-15'
// The bike arrives at the end of December: no rides in the plan, and no Saturday leg ban, before this Saturday.
export const RIDE_FROM = '2027-01-09'

// What the lifting rules mean for a given date, or null if nothing applies.
export function liftRuleFor(iso) {
  if (iso < SWIM_RIDE_FROM) return null
  const dow = new Date(iso + 'T12:00:00Z').getUTCDay() // 0 = Sunday
  if (dow === 1) return 'No chest, back or shoulders today (swim tomorrow)'
  if (dow === 2) return 'Legs, arms or off only today (swim tonight)'
  if ((dow === 4 || dow === 5 || dow === 6) && iso >= RIDE_FROM) return 'No legs today (Saturday ride)'
  return null
}

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

// This week's sessions: the dated week if there is one, else the phase's usual week.
export function weekPlan(today = localToday()) {
  // this week's swim from SWIM_SESSIONS (Tuesday of the Monday-to-Sunday week), shown first
  const monday = addIso(today, -((new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7))
  const tuesday = addIso(monday, 1)
  const swim = SWIM_SESSIONS[tuesday]
    ? `Tue ${new Date(tuesday + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}, 5 to 6pm: ${SWIM_SESSIONS[tuesday]}. If you miss it, do it on Thursday.`
    : null
  const withSwim = (w) => (swim ? { ...w, sessions: [swim, ...w.sessions] } : w)
  const dated = WEEKS.find((w) => today >= w.start && today <= w.end)
  if (dated) return withSwim(dated)
  const cp = currentPhase(today)
  if (cp.state === 'active' && PHASE_WEEKS[cp.phase.id]) {
    // the phase's usual week describes the swim in general terms; when a dated swim exists it replaces that line
    const usual = swim ? PHASE_WEEKS[cp.phase.id].filter((line) => !/^Tue.*swim/i.test(line)) : PHASE_WEEKS[cp.phase.id]
    return withSwim({ label: cp.label ? `${cp.phase.name}, ${cp.label.toLowerCase()} week` : cp.phase.name, km: null, sessions: usual })
  }
  return null
}

export function monthTarget(today = localToday()) {
  return MONTH_TARGETS.find((m) => m.month === today.slice(0, 7)) || null
}
