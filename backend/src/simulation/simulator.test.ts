import { describe, expect, it } from 'vitest';
import {
  ARRIVAL_NAMES,
  consultationMinutes,
  decide,
  drawLevel,
  frontOf,
  initialState,
  MINUTE_MS,
  minutesUntilNextArrival,
  seededRandom,
  type SimulationState,
} from './simulator.ts';

const T0 = new Date('2026-03-01T10:00:00.000Z').getTime();
const at = (minutes: number) => T0 + minutes * MINUTE_MS;

/** A state with no arrival due for a long while, so the room is all that moves. */
const quiet = (overrides: Partial<SimulationState> = {}): SimulationState => ({
  consultationEndsAt: null,
  nextArrivalAt: at(10_000),
  nameIndex: 0,
  ...overrides,
});

describe('consultationMinutes', () => {
  it('is the level average when the draw lands mid-window', () => {
    // Window is -5..+10; a draw of 1/3 gives offset 0.
    expect(consultationMinutes('GREEN', () => 1 / 3)).toBe(15);
  });

  it('runs 5 minutes short at the bottom of the window and 10 long at the top', () => {
    expect(consultationMinutes('GREEN', () => 0)).toBe(10);
    expect(consultationMinutes('GREEN', () => 0.999999)).toBe(25);
  });

  it('never goes under one minute', () => {
    expect(consultationMinutes('BLUE', () => 0)).toBeGreaterThanOrEqual(1);
  });
});

describe('drawLevel', () => {
  it('is deterministic for a seeded generator and favours green over red', () => {
    const random = seededRandom(42);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const level = drawLevel(random);
      counts[level] = (counts[level] ?? 0) + 1;
    }
    expect(counts['GREEN']).toBeGreaterThan(counts['RED'] ?? 0);
    expect(counts['YELLOW']).toBeGreaterThan(counts['RED'] ?? 0);
  });
});

describe('minutesUntilNextArrival', () => {
  it('averages the configured mean over many draws', () => {
    const random = seededRandom(7);
    let total = 0;
    for (let i = 0; i < 5000; i++) total += minutesUntilNextArrival(random);
    expect(total / 5000).toBeGreaterThan(13);
    expect(total / 5000).toBeLessThan(17);
  });
});

describe('decide', () => {
  const half = () => 0.5;

  it('calls the front patient in when the room is free', () => {
    const { actions, state } = decide(
      at(0),
      quiet(),
      { front: { id: 'kari', level: 'GREEN' }, occupant: null },
      half,
    );

    expect(actions).toEqual([{ type: 'callIn', visitId: 'kari' }]);
    // GREEN average 15, draw 0.5 in -5..+10 gives +2.5, rounded to 18 (banker's rounding is not used by Math.round).
    expect(state.consultationEndsAt).toBe(at(18));
  });

  it('does nothing while the consultation is still running', () => {
    const { actions } = decide(
      at(5),
      quiet({ consultationEndsAt: at(18) }),
      { front: { id: 'ola', level: 'GREEN' }, occupant: { id: 'kari', level: 'GREEN' } },
      half,
    );

    expect(actions).toEqual([]);
  });

  it('finishes the consultation when its time is up, and frees the room', () => {
    const { actions, state } = decide(
      at(18),
      quiet({ consultationEndsAt: at(18) }),
      { front: { id: 'ola', level: 'GREEN' }, occupant: { id: 'kari', level: 'GREEN' } },
      half,
    );

    expect(actions).toEqual([{ type: 'finish', visitId: 'kari' }]);
    expect(state.consultationEndsAt).toBeNull();
  });

  it('gives a consultation length to a patient someone else put in the room', () => {
    const { actions, state } = decide(
      at(0),
      quiet(),
      { front: null, occupant: { id: 'kari', level: 'RED' } },
      half,
    );

    expect(actions).toEqual([]);
    expect(state.consultationEndsAt).toBe(at(33));
  });

  it('registers an arrival when its time has come and schedules the next', () => {
    const { actions, state } = decide(
      at(0),
      quiet({ nextArrivalAt: at(0) }),
      { front: null, occupant: null },
      half,
    );

    expect(actions).toEqual([
      { type: 'arrive', patientName: ARRIVAL_NAMES[0], level: drawLevel(half) },
    ]);
    expect(state.nameIndex).toBe(1);
    expect(state.nextArrivalAt).toBeGreaterThan(at(0));
  });

  it('does not call in a patient on the tick they arrive', () => {
    const { actions } = decide(
      at(0),
      quiet({ nextArrivalAt: at(0) }),
      { front: null, occupant: null },
      half,
    );

    expect(actions.map((a) => a.type)).toEqual(['arrive']);
  });

  it('is repeatable: the same seed gives the same day', () => {
    const run = (seed: number) => {
      const random = seededRandom(seed);
      let state = initialState(at(0), random);
      const log: string[] = [];
      for (let minute = 0; minute < 240; minute++) {
        const result = decide(at(minute), state, { front: null, occupant: null }, random);
        state = result.state;
        log.push(...result.actions.map((a) => `${minute}:${a.type}`));
      }
      return log;
    };

    expect(run(1)).toEqual(run(1));
    expect(run(1)).not.toEqual(run(2));
  });
});

describe('frontOf', () => {
  it('picks by triage level first, then arrival', () => {
    const front = frontOf([
      { id: 'green-early', level: 'GREEN', arrivedAt: new Date(at(-60)) },
      { id: 'red-late', level: 'RED', arrivedAt: new Date(at(-5)) },
    ]);

    expect(front?.id).toBe('red-late');
  });

  it('is null when nobody is waiting', () => {
    expect(frontOf([])).toBeNull();
  });
});
