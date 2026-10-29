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
    instruction: 'Long run 18 to 20 km. Keep it easy: heart rate under 148. Then taper.',
    run: { kind: 'long', min: 18, max: 20, label: 'last long run' },
    liftNote: 'Keep the weights heavy, but trim the sets.',
    legsNote: 'Legs: about 40% fewer sets.'
  },
  {
    id: 'marathon-taper',
    name: 'Marathon: taper',
    start: '2026-11-02',
    end: '2026-11-08',
    instruction: 'Taper. Long run 10 to 12 km.',
    run: { kind: 'long', min: 10, max: 12, label: 'taper long run' },
    liftNote: 'Taper the lifting too: same weights, about 40% fewer sets, nothing new.',
    legsNote: 'Legs: light, or skip.'
  },
  {
    id: 'marathon-race',
    name: 'Marathon: race week',
    start: '2026-11-09',
    end: '2026-11-14',
    instruction: 'Race week: 6 to 8 km. Race on Saturday 14 Nov. Start at 6:15 to 6:30 per km, walk the aid stations, fuel from 45 minutes.',
    run: { kind: 'cap', max: 8 },
    liftNote: 'Race week: short and easy, upper body only.',
    legsNote: 'No legs this week.'
  },
  {
    id: 'recovery',
    name: 'Recovery and baseline tests',
    start: '2026-11-15',
    end: '2026-11-30',
    instruction: 'Recover first, then baseline tests: a 400 m swim and a 30 km ride.',
    liftNote: 'Recovering: lift light and stop well short of failure.',
    legsNote: 'Legs: half the usual sets.'
  },
  {
    id: 'base',
    name: 'Base',
    start: '2026-12-01',
    end: '2027-02-28',
    instruction: 'Swim technique. Rides of 25 to 60 km. Checkpoint: a 1,500 m swim and a 60 km ride.',
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
// Built from Andy's Garmin history (Feb to Oct 2026): 12 to 20 km of running a week in 1 or 2 runs,
// a 30.1 km run on 26 Sep at 6:49 per km and heart rate 144, a 17 km run at 5:58 per km and heart rate
// 145, VO2 max 47 rising to 49, 5K 21:51, 10K 45:45, half 1:57. Fitness is ahead of the weekly running
// volume, so the marathon plan protects the legs and adds nothing new.

// Dated weeks (Monday to Sunday) for the marathon and the weeks after it.
export const WEEKS = [
  {
    start: '2026-10-19',
    end: '2026-10-25',
    label: 'Last long run week',
    km: 'about 26 km running',
    sessions: [
      'Thu or Fri: 6 to 8 km easy, heart rate under 148 (the off-day run).',
      'Sat 24 Oct: long run 18 to 20 km, easy. Practise race fuelling: a gel at 45 minutes, then every 30 to 40. Race shoes and kit.',
      'No hard runs from now. The 5K and tempo work is done; more adds injury risk, not fitness.',
      'No legs on the day before or the two days after the long run.'
    ]
  },
  {
    start: '2026-10-26',
    end: '2026-11-01',
    label: 'Hold',
    km: 'about 20 km running',
    sessions: [
      'The last long run is done (21.3 km on 24 Oct). Nothing longer than 10 km from here to race day.',
      'Sun 25 and Mon 26: no running or only a 5 km very easy jog (heart rate under 140). The long run was a big load.',
      'Wed 28: 6 to 8 km easy, heart rate under 148, with 4 relaxed strides at the end.',
      'Thu 29 Oct: light swim with your daughter (easy, 20 to 30 minutes, about 400 to 600 m, heart rate under 130).',
      'Fri 30: 8 to 10 km with the middle 4 to 5 km at race pace, 6:15 to 6:30 per km. Heart rate should sit between 135 and 146; if it is over 150, slow down. Practise a gel at 45 minutes.',
      'Lifting stays heavy; trim leg sets by about 40%.'
    ]
  },
  {
    start: '2026-11-02',
    end: '2026-11-08',
    label: 'Taper',
    km: 'about 20 km running',
    sessions: [
      'Tue 3: easy 5 km. Thu 5: easy 4 to 5 km with 4 strides.',
      'Sat 7 Nov: 10 to 12 km easy, with the middle 3 km at race pace (6:15 to 6:30 per km).',
      'Thu 5 Nov: light swim with your daughter. It is easy on the legs.',
      'Lifting: same weights, about 40% fewer sets, nothing new. Legs light or skipped.',
      'Sleep is the main job this week: 7.5 hours or more.'
    ]
  },
  {
    start: '2026-11-09',
    end: '2026-11-14',
    label: 'Race week',
    km: '6 to 8 km running',
    sessions: [
      'Tue: 4 km easy with 4 strides. Thu: 3 km shake-out.',
      'Upper body only, short and easy, until Wednesday. No lifting Thursday or Friday.',
      'Thu and Fri: raise carbohydrate (about 8 g per kg a day), nothing new to eat, early nights.',
      'Fri: collect the number, lay out kit, gels and shoes. Sat 14 Nov: race.'
    ]
  },
  {
    start: '2026-11-15',
    end: '2026-11-21',
    label: 'Recover',
    km: 'little running',
    sessions: [
      'Sun to Wed: no running. Walk, easy spin, mobility.',
      'Thu 19 Nov: light swim with your daughter, good for tired legs. Then 20 to 30 minutes of easy jogging if the legs feel normal, heart rate under 140.',
      'Lifting light, stop well short of failure. Legs from the following week.'
    ]
  },
  {
    start: '2026-11-22',
    end: '2026-11-30',
    label: 'Baseline tests',
    km: '12 to 16 km running',
    sessions: [
      'Tue 24 Nov, 5 to 6pm: 400 m swim test at a steady effort, heart rate under 150. Time it, note how it felt.',
      'Sat 28 Nov: 30 km ride, steady, heart rate under 145 (zone 2). Note average speed and heart rate.',
      'One or two easy runs of 6 to 8 km.'
    ]
  }
]

// The run planned for a date: distance and heart rate zone. Zones are Andy's own: zone 1 100 to 132,
// zone 2 133 to 148, zone 3 149 to 159, zone 4 160 to 170, zone 5 171 and up.
export const RUN_SESSIONS = {
  '2026-10-25': 'Rest, or 20 to 30 min very easy, heart rate under 140 (zone 1-2)',
  '2026-10-26': 'Optional 5 km very easy, heart rate under 140 (zone 1-2)',
  '2026-10-28': 'Easy 6 to 8 km, heart rate under 148 (zone 2), 4 strides at the end',
  '2026-10-30': 'Race rhythm 8 to 10 km: middle 4 to 5 km at 6:15 to 6:30 per km, heart rate 135 to 146 (zone 2). Gel at 45 min',
  '2026-11-03': 'Easy 5 km, heart rate under 148 (zone 2)',
  '2026-11-05': 'Easy 4 to 5 km, heart rate under 148 (zone 2), 4 strides',
  '2026-11-10': 'Easy 4 km, heart rate under 148 (zone 2), 4 strides',
  '2026-11-12': 'Shake-out 3 km, very easy, heart rate under 140 (zone 1-2)',
  '2026-11-19': 'Easy jog 20 to 30 min, heart rate under 140 (zone 1-2)',
  '2026-11-22': 'Easy 6 to 8 km, heart rate under 148 (zone 2)',
  '2026-11-26': 'Easy 6 to 8 km, heart rate under 148 (zone 2)'
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
  { date: '2026-11-24', text: '400 m swim baseline test' },
  { date: '2026-11-28', text: '30 km baseline ride' },
  { date: '2027-02-27', text: 'base checkpoint: 1,500 m swim and 60 km ride' },
  { date: '2027-06-26', text: 'build checkpoint: 1,900 m swim and 85 km ride' },
  { date: '2027-09-18', text: 'dress rehearsal' },
  { date: '2027-10-02', text: 'last long session' }
]

// The taper long run follows the long-run slot (normally Saturday 7 Nov), so it is not tied to one date.
export const TAPER_RUN = 'Taper run 10 to 12 km, easy, middle 3 km at 6:15 to 6:30 per km, heart rate under 150 (zone 2-3)'

// Between these dates every run is spelled out in RUN_SESSIONS (or the long-run slot), so a day with
// no run there means no run, and no extra easy run is added on off days.
export const DATED_RUNS_FROM = '2026-10-25'
export const DATED_RUNS_UNTIL = '2026-11-30'

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
    'Off day from lifting: easy run of 40 to 60 minutes, heart rate under 148. This keeps your run base at 15 to 25 km a week.',
    'Thu: the light swim with your daughter is your second swim each week. Frequency builds swimming skill more than distance, so keep it going.'
  ],
  build: [
    'Tue: swim, building to 2,500 m a session (drills, then steady sets, heart rate under 140). First sea swims in May, in the wetsuit.',
    'Sat: long ride of 60 to 85 km, hilly, 10 km longer than the last at most. From May, one ride a month ends with a 15 minute easy run.',
    'Off day: easy run of 45 to 75 minutes. A long run of 14 to 18 km every second week keeps the half marathon legs.',
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
  lisbon: [
    'Pace: 6:15 to 6:30 per km for the first 30 km, with the first 5 km on the slow side.',
    'Heart rate: at this pace expect about 128 to 145 for the first 30 km (you ran 6:10 per km at 131 on 29 Oct). If it is over 155 before 25 km, ease off by 10 to 15 seconds per km.',
    'Your 30 km on 26 Sep was 6:49 per km at heart rate 144, so this pace is well inside what you have shown.',
    'Expect 4:20 to 4:35. Your half marathon (1:57) predicts faster on paper, but your weekly running is low, so protect the last 10 km.',
    'Fuel: a gel at 45 minutes, then every 30 to 40 (about 60 g of carbohydrate an hour). Walk the aid stations and drink there.',
    'From 32 km, if heart rate is under 158 and the legs are good, you may lift the pace a little. Otherwise hold.'
  ],
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
  { name: 'Marathon', hr: '128 to 145, drifting up late', pace: '6:15 to 6:30 per km' },
  { name: 'Steady', hr: '149 to 159', pace: 'about 5:20 to 5:50 per km' },
  { name: 'Threshold', hr: '160 to 170', pace: 'about 4:35 to 5:00 per km (10K was 45:45)' },
  { name: 'Hard', hr: '171 and up', pace: 'short efforts only' }
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
  { title: 'Term time', text: '2 sessions a week (swim Tuesday 5 to 6pm, ride Saturday), on top of lifting.' },
  { title: 'School holidays', text: '4 to 6 sessions a week.' },
  { title: 'July and August', text: 'Main block, 7 to 8 sessions a week.' },
  {
    title: 'Thursday family swim',
    text: 'A light swim with your daughter, 20 to 30 minutes. Play first, then a few relaxed lengths of technique. It is water practice, not training load.'
  }
]

// A light swim with his daughter every Thursday, from the first Thursday after the marathon block
// started. It is easy, short and for fun, so it counts as practice in the water, not training load.
export const FAMILY_SWIM = {
  from: '2026-10-29',
  text: 'Light swim with your daughter, 20 to 30 min (about 400 to 600 m), play first, heart rate under 130'
}

// How the app decides what to suggest. This is the list the schedule, the Today advice and the coach all
// follow, kept here in plain words so it can be read in the Plan tab.
export const APP_RULES = [
  { title: 'Which lift is next', text: 'The lift that has gone longest without being done (shoulders, back, legs, chest, arms). The same lift is never suggested twice within 5 days. After 5 lifting days in a row there is an off day.' },
  { title: 'Reading your workouts', text: 'The first muscle in the title is the day\'s lift. Triceps or biceps added to another muscle are extras, so "Chest, Triceps" counts as chest. Each lift flips between a heavy day and a volume day.' },
  { title: 'Legs', text: 'Never in the 2 days before or after a run of 15 km or more, never in the 7 days before a race, and not for 5 days after the marathon. From 15 Nov: no legs Thursday to Saturday (the ride), and Tuesday is legs, arms or off only (the swim).' },
  { title: 'Days with no lifting', text: 'The long-run day, a race-rhythm run day, and the two days before a race. A full rest day has no lifting and no run.' },
  { title: 'Easy means easy', text: 'Easy running is heart rate under 148 (zone 2), and about 80% of training stays easy. The day after a long run is rest or 30 minutes under 140. After heavy legs, keep the run to 5 to 6 km.' },
  { title: 'The long run', text: 'It goes on the first weekend day at least 3 days after your last legs session and 4 days after another run of 15 km or more. A run of 18 km or more counts as the last long run.' },
  { title: 'Runs done early', text: 'A run done up to 2 days before a planned one counts for it, if it is at least three quarters of the distance. Moving a run to another day makes the day it left a full rest day.' },
  { title: 'Recovery bar', text: 'Starts at the top and loses a step for short sleep, a low Garmin HRV status, and the trends below. Training is the same bar after your recent load: heavy days in a row, a big week of running, no rest day in 14 days.' },
  { title: 'Recovery trends', text: 'Watched against your own normal: resting HR 3 or more bpm up for 2 days, HRV 12% or more down for 3 days, a run of short nights or a week of sleep debt, and resting HR up with HRV down together. A trend you can see cuts sets by a third, then 40% with easy short runs and no legs for 2 days, and at the worst a rest day tomorrow.' },
  { title: 'Weights and runs', text: 'Morning weights are found from a raised heart-rate block, kept apart from runs. Runs, swims and rides come from Garmin when you refresh. A run with no lift found that day counts as your run day.' },
  { title: 'The coach', text: 'It reads all of this and your latest data after each refresh. It can lighten the day, move a planned run, add a rest day or leave a note, and every change shows with an Undo. It cannot add training or break these rules.' }
]

// The weekday lifting rules start once swim and ride sessions begin (after the 15 Nov recovery).
export const SWIM_RIDE_FROM = '2026-11-15'

// What the lifting rules mean for a given date, or null if nothing applies.
export function liftRuleFor(iso) {
  if (iso < SWIM_RIDE_FROM) return null
  const dow = new Date(iso + 'T12:00:00Z').getUTCDay() // 0 = Sunday
  if (dow === 1) return 'No chest, back or shoulders today (swim tomorrow)'
  if (dow === 2) return 'Legs, arms or off only today (swim tonight)'
  if (dow === 4 || dow === 5 || dow === 6) return 'No legs today (Saturday ride)'
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
  const dated = WEEKS.find((w) => today >= w.start && today <= w.end)
  if (dated) return dated
  const cp = currentPhase(today)
  if (cp.state === 'active' && PHASE_WEEKS[cp.phase.id]) {
    return { label: cp.label ? `${cp.phase.name}, ${cp.label.toLowerCase()} week` : cp.phase.name, km: null, sessions: PHASE_WEEKS[cp.phase.id] }
  }
  return null
}

export function monthTarget(today = localToday()) {
  return MONTH_TARGETS.find((m) => m.month === today.slice(0, 7)) || null
}
