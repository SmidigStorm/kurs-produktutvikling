import { describe, expect, it } from 'vitest';
import { fixedClock } from '../clock.ts';
import { orderQueue } from '../domain/queue.ts';
import { visits } from './schema.ts';
import { seedDemoData } from './seed.ts';
import { createTestDb } from './testDb.ts';

const CLOCK = () => fixedClock(new Date('2026-03-01T09:00:00.000Z'));

describe('seedDemoData', () => {
  it('creates a queue with more than one triage level represented', () => {
    const db = createTestDb();

    seedDemoData(db, CLOCK());

    const rows = db.select().from(visits).all();
    expect(rows.length).toBeGreaterThanOrEqual(5);
    expect(new Set(rows.map((r) => r.level)).size).toBeGreaterThan(1);
  });

  it('is deterministic: the same clock produces the same queue order', () => {
    const order = () => {
      const db = createTestDb();
      seedDemoData(db, CLOCK());
      return orderQueue(
        db.select().from(visits).all().map((r) => ({
          id: r.id,
          level: r.level,
          arrivedAt: r.arrivedAt,
        })),
      ).map((v) => v.id);
    };

    expect(order()).toEqual(order());
  });

  it('replaces existing data rather than appending', () => {
    const db = createTestDb();

    seedDemoData(db, CLOCK());
    seedDemoData(db, CLOCK());

    expect(db.select().from(visits).all()).toHaveLength(5);
  });
});
