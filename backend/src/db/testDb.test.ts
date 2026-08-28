import { describe, expect, it } from 'vitest';
import { visits } from './schema.js';
import { createTestDb } from './testDb.js';

describe('createTestDb', () => {
  it('returns an in-memory database with the schema applied', () => {
    const db = createTestDb();

    db.insert(visits)
      .values({
        id: 'v1',
        patientName: 'Kari Nordmann',
        level: 'GREEN',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    const rows = db.select().from(visits).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.patientName).toBe('Kari Nordmann');
    expect(rows[0]?.arrivedAt.toISOString()).toBe('2026-03-01T09:00:00.000Z');
  });

  it('is isolated: a second database does not see the first one rows', () => {
    createTestDb()
      .insert(visits)
      .values({
        id: 'only-in-first',
        patientName: 'Ola',
        level: 'GREEN',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    expect(createTestDb().select().from(visits).all()).toHaveLength(0);
  });

  it('types the level column as the union, with no cast', () => {
    const db = createTestDb();
    db.insert(visits)
      .values({
        id: 'v2',
        patientName: 'Ingrid',
        level: 'RED',
        status: 'WAITING',
        arrivedAt: new Date('2026-03-01T09:00:00.000Z'),
      })
      .run();

    const row = db.select().from(visits).all()[0];
    // If this compiles without `as TriageLevel`, the enum option is working.
    const level: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE' | undefined = row?.level;
    expect(level).toBe('RED');
  });
});
