import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { Clock } from '../clock.ts';
import type { Db } from '../db/client.ts';
import { visits } from '../db/schema.ts';
import { decide, frontOf, initialState, type Action, type Random } from './simulator.ts';

export type Simulation = { stop(): void };

/**
 * Applies the simulator's decisions to the database on a real-time interval.
 * Reads the queue fresh each tick, so anything staff do in between is respected.
 */
export function runSimulation(deps: {
  db: Db;
  clock: Clock;
  random: Random;
  intervalMs: number;
}): Simulation {
  const { db, clock, random } = deps;
  let state = initialState(clock.now().getTime(), random);

  const snapshot = () => {
    const rows = db.select().from(visits).all();
    const occupantRow = rows.find((r) => r.status === 'IN_CONSULTATION');
    return {
      front: frontOf(rows.filter((r) => r.status === 'WAITING')),
      occupant: occupantRow ? { id: occupantRow.id, level: occupantRow.level } : null,
    };
  };

  const apply = (action: Action) => {
    switch (action.type) {
      case 'callIn':
        db.update(visits).set({ status: 'IN_CONSULTATION' }).where(eq(visits.id, action.visitId)).run();
        return;
      case 'finish':
        db.update(visits).set({ status: 'DONE' }).where(eq(visits.id, action.visitId)).run();
        return;
      case 'arrive':
        db.insert(visits)
          .values({
            id: randomUUID(),
            patientName: action.patientName,
            level: action.level,
            status: 'WAITING',
            arrivedAt: clock.now(),
          })
          .run();
        return;
    }
  };

  const tick = () => {
    const result = decide(clock.now().getTime(), state, snapshot(), random);
    state = result.state;
    result.actions.forEach(apply);
  };

  const timer = setInterval(tick, deps.intervalMs);
  return { stop: () => clearInterval(timer) };
}
