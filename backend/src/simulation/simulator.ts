import type { TriageLevel } from 'contract';
import { AVERAGE_CONSULTATION_MINUTES, TRIAGE_PRIORITY } from '../domain/triage.ts';

/**
 * The simulated day, as decisions. Instructor tooling for the classroom, not
 * a product feature: it makes the queue move by itself so the room can watch
 * the app change. Everything here is pure; `runSimulation` in loop.ts applies
 * the decisions to the database on a timer.
 *
 * One consultation room. The patient at the front goes in when it is free and
 * stays for their level's average plus a random offset. New patients arrive at
 * random intervals with a level weighted toward green and yellow.
 */

/** A source of numbers in [0, 1). `Math.random` in dev, seeded in tests. */
export type Random = () => number;

export const MINUTE_MS = 60_000;

/** A consultation runs this much shorter or longer than the level's average. */
export const CONSULTATION_OFFSET_MINUTES = { min: -5, max: 10 };

export const MEAN_MINUTES_BETWEEN_ARRIVALS = 15;

/** Relative likelihood of each level for a simulated arrival. RED stays rare. */
export const ARRIVAL_LEVEL_WEIGHTS: Record<TriageLevel, number> = {
  RED: 1,
  ORANGE: 2,
  YELLOW: 4,
  GREEN: 6,
  BLUE: 2,
};

/** Fictional names, cycled. No clinical content anywhere. */
export const ARRIVAL_NAMES = [
  'Sigrid Haugen',
  'Even Dahl',
  'Aslaug Moen',
  'Tobias Lund',
  'Ragnhild Vik',
  'Henrik Strand',
  'Åse Bakke',
  'Mats Solberg',
  'Live Nygård',
  'Petter Holm',
  'Ida Fossum',
  'Kristoffer Aune',
  'Solveig Brekke',
  'Truls Eide',
  'Marte Grøn',
];

export type SimulationState = {
  /** Simulated time at which the current consultation ends, or null when the room is free. */
  consultationEndsAt: number | null;
  /** Simulated time of the next arrival. */
  nextArrivalAt: number;
  /** Index into ARRIVAL_NAMES for the next arrival. */
  nameIndex: number;
};

export type QueueSnapshot = {
  /** The patient who would be seen next, or null when nobody is waiting. */
  front: { id: string; level: TriageLevel } | null;
  /** The patient in the room, or null when it is free. */
  occupant: { id: string; level: TriageLevel } | null;
};

export type Action =
  | { type: 'callIn'; visitId: string }
  | { type: 'finish'; visitId: string }
  | { type: 'arrive'; patientName: string; level: TriageLevel };

/** The level's average, plus an offset drawn uniformly from the window. Never under one minute. */
export function consultationMinutes(level: TriageLevel, random: Random): number {
  const { min, max } = CONSULTATION_OFFSET_MINUTES;
  const offset = min + random() * (max - min);
  return Math.max(1, Math.round(AVERAGE_CONSULTATION_MINUTES[level] + offset));
}

/** Weighted draw over ARRIVAL_LEVEL_WEIGHTS. */
export function drawLevel(random: Random): TriageLevel {
  const levels = Object.keys(ARRIVAL_LEVEL_WEIGHTS) as TriageLevel[];
  const total = levels.reduce((sum, level) => sum + ARRIVAL_LEVEL_WEIGHTS[level], 0);
  let roll = random() * total;
  for (const level of levels) {
    roll -= ARRIVAL_LEVEL_WEIGHTS[level];
    if (roll < 0) return level;
  }
  return levels[levels.length - 1] ?? 'GREEN';
}

/** Exponentially distributed, so arrivals bunch and thin the way real ones do. */
export function minutesUntilNextArrival(random: Random): number {
  return -MEAN_MINUTES_BETWEEN_ARRIVALS * Math.log(1 - random());
}

export function initialState(now: number, random: Random): SimulationState {
  return {
    consultationEndsAt: null,
    nextArrivalAt: now + minutesUntilNextArrival(random) * MINUTE_MS,
    nameIndex: 0,
  };
}

/**
 * One tick: given the simulated time and what the queue looks like, say what
 * happens now. Pure. The room is handled before arrivals so a new arrival is
 * never called in on the same tick it arrives.
 */
export function decide(
  now: number,
  state: SimulationState,
  queue: QueueSnapshot,
  random: Random,
): { actions: Action[]; state: SimulationState } {
  const actions: Action[] = [];
  let next = { ...state };

  if (queue.occupant) {
    if (next.consultationEndsAt === null) {
      // Someone was put in the room without us, by staff or by a restart.
      // Give them a consultation length from now.
      next.consultationEndsAt = now + consultationMinutes(queue.occupant.level, random) * MINUTE_MS;
    } else if (now >= next.consultationEndsAt) {
      actions.push({ type: 'finish', visitId: queue.occupant.id });
      next.consultationEndsAt = null;
    }
  } else if (queue.front) {
    actions.push({ type: 'callIn', visitId: queue.front.id });
    next.consultationEndsAt = now + consultationMinutes(queue.front.level, random) * MINUTE_MS;
  } else {
    next.consultationEndsAt = null;
  }

  if (now >= next.nextArrivalAt) {
    actions.push({
      type: 'arrive',
      patientName: ARRIVAL_NAMES[next.nameIndex % ARRIVAL_NAMES.length] ?? 'Pasient',
      level: drawLevel(random),
    });
    next = {
      ...next,
      nameIndex: next.nameIndex + 1,
      nextArrivalAt: now + minutesUntilNextArrival(random) * MINUTE_MS,
    };
  }

  return { actions, state: next };
}

/** Who is seen next: the queue invariant, on a snapshot of waiting patients. */
export function frontOf(waiting: { id: string; level: TriageLevel; arrivedAt: Date }[]) {
  const [first] = [...waiting].sort(
    (a, b) =>
      TRIAGE_PRIORITY[a.level] - TRIAGE_PRIORITY[b.level] ||
      a.arrivedAt.getTime() - b.arrivedAt.getTime(),
  );
  return first ? { id: first.id, level: first.level } : null;
}

/** A small deterministic generator (mulberry32) for tests and repeatable demos. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
