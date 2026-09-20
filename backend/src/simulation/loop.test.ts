import { afterEach, describe, expect, it, vi } from 'vitest';
import { scaledClock } from '../clock.ts';
import { seedDemoData } from '../db/seed.ts';
import { visits } from '../db/schema.ts';
import { createTestDb } from '../db/testDb.ts';
import { runSimulation } from './loop.ts';
import { seededRandom } from './simulator.ts';

const START = new Date('2026-03-01T10:00:00.000Z');

/** A seeded queue and a simulation loop over it, on fake timers. */
const running = (paused: boolean) => {
  vi.useFakeTimers({ now: START });

  const db = createTestDb();
  const clock = scaledClock(START, 60);
  seedDemoData(db, clock);
  clock.setRunning(!paused);

  const simulation = runSimulation({ db, clock, random: seededRandom(1), intervalMs: 250 });
  const statuses = () => db.select().from(visits).all().map((row) => row.status);

  return { clock, simulation, statuses };
};

afterEach(() => {
  vi.useRealTimers();
});

describe('runSimulation', () => {
  it('leaves the queue alone while it is paused', () => {
    const { simulation, statuses } = running(true);
    const before = statuses();

    // Long enough for a consultation and several arrivals at 60x, had it run.
    vi.advanceTimersByTime(60_000);

    expect(statuses()).toEqual(before);
    simulation.stop();
  });

  it('starts moving the queue when it is set running', () => {
    const { clock, simulation, statuses } = running(true);

    clock.setRunning(true);
    vi.advanceTimersByTime(250);

    expect(statuses()).toContain('IN_CONSULTATION');
    simulation.stop();
  });
});
