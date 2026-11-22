// A VO2 max score that does not come from the Garmin watch. Two published methods, both pure maths on
// numbers you already have (a pace, a heart rate, a race time).
//
// 1. Interval method: oxygen cost of the pace (Daniels and Gilbert running equation), divided by how
//    hard the heart was working (percent of heart rate reserve, which tracks percent of VO2 reserve:
//    Swain and Leutholtz 1997). Typical error is about 4 to 5 ml/kg/min, so treat it as a range.
// 2. Race method: Daniels VDOT, which is VO2 max implied by a race time. Needs a full effort to be fair.
//
// Neither is a lab test. A real VO2 max test is the only exact answer; these are for tracking change.

// Oxygen cost of running at v metres per minute (Daniels and Gilbert), ml/kg/min.
export function runningCost(vMetresPerMin) {
  return -4.6 + 0.182258 * vMetresPerMin + 0.000104 * vMetresPerMin * vMetresPerMin
}

// Fraction of VO2 max a runner can hold for t minutes (Daniels and Gilbert).
function sustainableFraction(tMinutes) {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * tMinutes) + 0.2989558 * Math.exp(-0.1932605 * tMinutes)
}

// VDOT from one race: distance in metres, time in seconds.
export function vdotFromRace(distanceM, seconds) {
  const t = seconds / 60
  return runningCost(distanceM / t) / sustainableFraction(t)
}

// One interval session. efforts: [{ distanceM, seconds, avgHr }]. Returns the estimate and its pieces.
export function vo2FromIntervals(efforts, { restingHr, maxHr }) {
  const good = efforts.filter((e) => e.distanceM > 0 && e.seconds > 0 && e.avgHr > restingHr)
  if (!good.length) return null
  const totalSec = good.reduce((s, e) => s + e.seconds, 0)
  const perEffort = good.map((e) => {
    const v = (e.distanceM / e.seconds) * 60
    const demand = runningCost(v)
    const hrr = Math.min(0.99, (e.avgHr - restingHr) / (maxHr - restingHr))
    return { demand, hrr, vo2max: 3.5 + (demand - 3.5) / hrr, seconds: e.seconds }
  })
  const vo2max = perEffort.reduce((s, p) => s + p.vo2max * p.seconds, 0) / totalSec
  const hrr = perEffort.reduce((s, p) => s + p.hrr * p.seconds, 0) / totalSec
  return { vo2max, hrr, perEffort }
}

// How much the answer moves if the inputs are a little off (max heart rate 3 bpm either way).
export function intervalRange(efforts, hr) {
  // A higher max heart rate means the effort was a smaller share of your reserve, so the score goes up.
  const up = vo2FromIntervals(efforts, { ...hr, maxHr: hr.maxHr + 3 })
  const down = vo2FromIntervals(efforts, { ...hr, maxHr: hr.maxHr - 3 })
  return up && down ? { low: down.vo2max, high: up.vo2max } : null
}

// The pace (seconds per km) you would need to hold at a given effort (fraction of heart rate reserve)
// for the interval method to read `target`. Solves the running equation for speed.
export function paceForVo2max(target, hrr) {
  const demand = 3.5 + (target - 3.5) * hrr
  const c = -4.6 - demand
  const v = (-0.182258 + Math.sqrt(0.182258 * 0.182258 - 4 * 0.000104 * c)) / (2 * 0.000104)
  return 60000 / v
}

export function paceLabel(secondsPerKm) {
  const m = Math.floor(secondsPerKm / 60)
  const s = Math.round(secondsPerKm - m * 60)
  return `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}`
}
