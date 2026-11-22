// What the research says a Heavy, Mixed and Volume session should look like for each muscle group,
// and the "optimal line" the Progress charts compare your workouts with.
//
// Sources (short): ACSM 2009 position stand on resistance training progression; Schoenfeld 2017 dose-response
// meta-analysis of weekly sets; Schoenfeld 2021 on loading for strength vs size; Schoenfeld 2016 on rest
// intervals and on training each muscle twice a week; Baz-Valle 2022 on weekly sets; Refalo 2023 on proximity to
// failure; Maeo 2021 and 2022 on lengthened-position exercises (leg curl, overhead triceps work).
// This is a training guide built from group averages, not a prescription.

import { percentOfBest } from './loadType'

export const TYPES = ['Heavy', 'Mixed', 'Volume']
export const TYPE_COLOUR = { Heavy: '#ff8a3d', Mixed: '#6b8cff', Volume: '#8ccf3a' }

// What each kind of session is for, and the rep, intensity and effort targets that go with it.
export const TYPE_INFO = {
  Heavy: {
    goal: 'Strength: lift heavier weights for few reps.',
    reps: [3, 6],
    intensity: [80, 90], // % of your best estimated one-rep max
    effort: 'Stop 1 to 2 reps short of failure on every set, and keep the bar speed crisp.',
    evidence: [
      'Loads of about 80% of your max or more build strength best, while muscle size grows over a wide range of loads (Schoenfeld 2021).',
      'Rests of 3 minutes or more on the big lifts give more strength and size than 1 minute (Schoenfeld 2016).'
    ],
    blocks: [
      { slot: 'main', sets: 4, reps: 5, rest: '3 to 5 min' },
      { slot: 'second', sets: 3, reps: 6, rest: '2 to 3 min' }
    ]
  },
  Mixed: {
    goal: 'Strength and size together: one heavy lift, then higher-rep work.',
    reps: [6, 12],
    intensity: [72, 82],
    effort: 'Heavy lift: 1 to 2 reps in reserve. Last sets of the lighter work: 1 rep short of failure.',
    evidence: [
      'Strength and size both improve across the whole rep range when sets are taken close to failure (Schoenfeld 2021), so mixing them is a sound way to train both.',
      'Training each muscle about twice a week beats once a week for size (Schoenfeld 2016).'
    ],
    blocks: [
      { slot: 'main', sets: 3, reps: 6, rest: '2 to 3 min' },
      { slot: 'accessory', sets: 3, reps: 10, rest: '90 s to 2 min' },
      { slot: 'isolation', sets: 3, reps: 12, rest: '60 to 90 s' }
    ]
  },
  Volume: {
    goal: 'Muscle size: more sets at moderate weights.',
    reps: [10, 15],
    intensity: [65, 75],
    effort: 'Finish each set 1 to 2 reps short of failure; the last set of each exercise can go to failure.',
    evidence: [
      'About 10 to 20 hard sets per muscle per week builds the most size, with diminishing returns beyond that (Schoenfeld 2017; Baz-Valle 2022).',
      'Sets within about 0 to 3 reps of failure grow muscle about the same, so you do not need to grind every rep (Refalo 2023).'
    ],
    blocks: [
      { slot: 'main', sets: 4, reps: 10, rest: '90 s to 2 min' },
      { slot: 'accessory', sets: 4, reps: 12, rest: '60 to 90 s' },
      { slot: 'isolation', sets: 3, reps: 15, rest: '60 s' }
    ]
  }
}

// Evidence-based picks for each muscle. `match` finds the lift in your own log so the weights can be set from
// your best on it; `not` stops a flat bench matching an incline one.
export const EXERCISES = {
  Chest: [
    { slot: 'main', name: 'Barbell or dumbbell bench press', match: ['bench press', 'bench'], not: ['incline', 'decline', 'close'] },
    { slot: 'second', name: 'Incline dumbbell press', match: ['incline'], note: 'upper chest' },
    { slot: 'accessory', name: 'Weighted dips', match: ['dip'] },
    { slot: 'isolation', name: 'Cable fly or pec deck', match: ['fly', 'flye', 'pec deck'], note: 'stretched at the bottom' }
  ],
  Back: [
    { slot: 'main', name: 'Pull-ups or lat pulldown', match: ['pull-up', 'pullup', 'pull up', 'pulldown', 'pull down', 'chin'] },
    { slot: 'second', name: 'Barbell or chest-supported row', match: ['barbell row', 'bent over', 'chest supported', 'chest-supported', 'row'], not: ['cable', 'seated'] },
    { slot: 'accessory', name: 'Seated cable row', match: ['seated row', 'cable row', 'seated cable'] },
    { slot: 'isolation', name: 'Straight-arm pulldown', match: ['straight arm', 'straight-arm'] }
  ],
  Shoulders: [
    { slot: 'main', name: 'Standing or seated overhead press', match: ['overhead press', 'shoulder press', 'military', 'ohp'] },
    { slot: 'second', name: 'Seated dumbbell shoulder press', match: ['dumbbell shoulder', 'dumbbell press', 'db press'] },
    { slot: 'accessory', name: 'Rear-delt fly or face pull', match: ['face pull', 'rear delt', 'reverse fly', 'rear fly'] },
    { slot: 'isolation', name: 'Lateral raise (cable or dumbbell)', match: ['lateral raise', 'side raise', 'lateral'], note: 'side delts' }
  ],
  Quads: [
    { slot: 'main', name: 'Back or front squat', match: ['back squat', 'front squat', 'squat'], not: ['split', 'bulgarian', 'hack'] },
    { slot: 'second', name: 'Leg press or hack squat', match: ['leg press', 'hack'] },
    { slot: 'accessory', name: 'Bulgarian split squat', match: ['bulgarian', 'split squat', 'lunge'] },
    { slot: 'isolation', name: 'Leg extension', match: ['leg extension', 'extension'] }
  ],
  Hamstrings: [
    { slot: 'main', name: 'Romanian deadlift', match: ['romanian', 'rdl', 'stiff'] },
    { slot: 'second', name: 'Hip thrust or deadlift', match: ['hip thrust', 'deadlift'], not: ['romanian'] },
    { slot: 'accessory', name: 'Seated leg curl', match: ['seated leg curl', 'leg curl', 'hamstring curl'], note: 'seated grows more than lying (Maeo 2021)' },
    { slot: 'isolation', name: 'Nordic curl or lying leg curl', match: ['nordic', 'lying'] }
  ],
  Biceps: [
    { slot: 'main', name: 'Barbell or EZ-bar curl', match: ['barbell curl', 'ez', 'bar curl'] },
    { slot: 'second', name: 'Hammer curl', match: ['hammer'] },
    { slot: 'accessory', name: 'Incline dumbbell curl', match: ['incline'], note: 'stretched position' },
    { slot: 'isolation', name: 'Preacher or cable curl', match: ['preacher', 'cable curl'] }
  ],
  Triceps: [
    { slot: 'main', name: 'Close-grip bench press or dips', match: ['close grip', 'close-grip', 'dip'] },
    { slot: 'second', name: 'Skull crusher', match: ['skull', 'lying triceps'] },
    { slot: 'accessory', name: 'Overhead triceps extension', match: ['overhead'], note: 'long head grows more overhead (Maeo 2022)' },
    { slot: 'isolation', name: 'Cable pushdown', match: ['pushdown', 'push down', 'pressdown'] }
  ],
  Abs: [
    { slot: 'main', name: 'Hanging leg raise', match: ['hanging', 'leg raise'] },
    { slot: 'second', name: 'Ab wheel rollout', match: ['rollout', 'ab wheel'] },
    { slot: 'accessory', name: 'Cable crunch', match: ['cable crunch', 'crunch'] },
    { slot: 'isolation', name: 'Plank with weight', match: ['plank'] }
  ]
}

const round25 = (kg) => Math.round(kg / 2.5) * 2.5

// Looks for one of your logged exercises that matches a suggested lift. best: Map(exerciseId -> best est. 1RM).
function findLogged(pick, exercises, best, group) {
  const hits = (exercises || []).filter((e) => {
    const name = e.name.toLowerCase()
    // only lifts filed under this muscle group (or not filed yet), so a chest press never stands in for a shoulder press
    if (e.category && e.category !== group && e.category !== 'Other') return false
    return pick.match.some((m) => name.includes(m)) && !(pick.not || []).some((n) => name.includes(n)) && best.get(e.id)
  })
  hits.sort((a, b) => best.get(b.id) - best.get(a.id))
  return hits[0] || null
}

// The research-backed session for a muscle group and type, with weights from your own bests where the lift is in
// your log. setsFactor comes from bodyStats.js (age and training experience).
// Returns { type, goal, effort, evidence, blocks: [{ name, note, sets, reps, rest, pct, kg, logged }], totalSets }.
export function researchWorkout(type, group, { exercises = [], best = new Map(), setsFactor = 1 } = {}) {
  const info = TYPE_INFO[type]
  const picks = EXERCISES[group] || EXERCISES.Chest
  const used = new Set()
  const blocks = info.blocks.map((b) => {
    // An accessory can be a second compound variation (incline press for chest) as well as a true accessory;
    // between those, the lift already in your log is preferred so the weight can be set from your best on it.
    const fits = picks.filter((p) => !used.has(p.name) && (p.slot === b.slot || (b.slot === 'accessory' && p.slot === 'second')))
    const pick =
      fits.find((p) => findLogged(p, exercises, best, group)) || fits[0] || picks.find((p) => !used.has(p.name)) || picks[0]
    used.add(pick.name)
    const logged = findLogged(pick, exercises, best, group)
    const pct = Math.round(percentOfBest(b.reps) * 100)
    const sets = Math.max(2, Math.round(b.sets * setsFactor))
    return {
      name: pick.name,
      note: pick.note || null,
      sets,
      reps: b.reps,
      rest: b.rest,
      pct,
      kg: logged ? round25((pct / 100) * best.get(logged.id)) : null,
      logged: logged ? logged.name : null,
      loggedId: logged ? logged.id : null
    }
  })
  return {
    type,
    goal: info.goal,
    effort: info.effort,
    evidence: info.evidence,
    blocks,
    totalSets: blocks.reduce((s, b) => s + b.sets, 0)
  }
}

// The research dose for one logged workout, in kg lifted: the same blocks as researchWorkout, with each block's weight
// taken from the strength of the lifts you chose (strongest lift first). nGroups > 1 adds blocks for the extra muscles.
// strengths: your best est. 1RM for each lift in the workout.
export function optimalVolume(type, strengths, { setsFactor = 1, nGroups = 1 } = {}) {
  const info = TYPE_INFO[type]
  const sorted = [...strengths].filter((x) => x > 0).sort((a, b) => b - a)
  if (!sorted.length) return null
  const scale = 1 + 0.7 * Math.max(0, nGroups - 1)
  return Math.round(
    info.blocks.reduce((sum, b, i) => {
      const oneRM = sorted[Math.min(i, sorted.length - 1)]
      const sets = Math.max(2, Math.round(b.sets * setsFactor))
      return sum + sets * b.reps * percentOfBest(b.reps) * oneRM
    }, 0) * scale
  )
}

// Sets the research dose asks for in one session (for the "sets" stat under each chart).
export function optimalSets(type, { setsFactor = 1, nGroups = 1 } = {}) {
  const scale = 1 + 0.7 * Math.max(0, nGroups - 1)
  return Math.round(TYPE_INFO[type].blocks.reduce((s, b) => s + Math.max(2, Math.round(b.sets * setsFactor)), 0) * scale)
}
