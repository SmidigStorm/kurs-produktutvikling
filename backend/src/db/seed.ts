import type { TriageLevel } from 'contract';
import type { Clock } from '../clock.ts';
import type { Db } from './client.ts';
import { triageEvents, visits } from './schema.ts';

type SeedRow = {
  id: string;
  patientName: string;
  level: TriageLevel;
  minutesAgo: number;
};

/** Fictional names, no clinical content. Fixed offsets keep seeding deterministic. */
const DEMO_QUEUE: SeedRow[] = [
  { id: 'seed-1', patientName: 'Kari Nordmann', level: 'GREEN', minutesAgo: 55 },
  { id: 'seed-2', patientName: 'Ola Hansen', level: 'YELLOW', minutesAgo: 40 },
  { id: 'seed-3', patientName: 'Ingrid Berg', level: 'GREEN', minutesAgo: 35 },
  { id: 'seed-4', patientName: 'Jonas Lie', level: 'BLUE', minutesAgo: 20 },
  { id: 'seed-5', patientName: 'Maja Solum', level: 'ORANGE', minutesAgo: 5 },
];

export function seedDemoData(db: Db, clock: Clock): void {
  const now = clock.now().getTime();

  // The callback MUST be synchronous — better-sqlite3 rejects an async one
  // outright with "Transaction function cannot return a promise".
  db.transaction((tx) => {
    tx.delete(triageEvents).run();
    tx.delete(visits).run();

    for (const row of DEMO_QUEUE) {
      tx.insert(visits)
        .values({
          id: row.id,
          patientName: row.patientName,
          level: row.level,
          status: 'WAITING',
          arrivedAt: new Date(now - row.minutesAgo * 60_000),
        })
        .run();
    }
  });
}
