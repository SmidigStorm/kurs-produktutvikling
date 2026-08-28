import type { TriageLevel } from 'contract';

/** Lower number means more urgent. Patients are served in this order. */
export const TRIAGE_PRIORITY: Record<TriageLevel, number> = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 3,
  GREEN: 4,
  BLUE: 5,
};

/**
 * How many minutes a consultation takes on average at this level.
 * Constants on purpose: the wait estimate is a defined function, not a prediction.
 */
export const AVERAGE_CONSULTATION_MINUTES: Record<TriageLevel, number> = {
  RED: 30,
  ORANGE: 25,
  YELLOW: 20,
  GREEN: 15,
  BLUE: 10,
};
