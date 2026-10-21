// The race being built towards: the next upcoming race in the plan (src/plan.js).
// It moves on to the next race by itself once a race date has passed.
import { nextRace } from './plan'

export const RACE = nextRace()
