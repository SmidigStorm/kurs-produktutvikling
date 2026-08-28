import type { TriageLevel } from 'contract';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock } from '../clock.ts';
import type { Db } from '../db/client.ts';
import { triageEvents, visits } from '../db/schema.ts';
import { createTestDb } from '../db/testDb.ts';
import { createApp } from './app.ts';

let db: Db;
const clock = fixedClock(new Date('2026-03-01T10:00:00.000Z'));

beforeEach(() => {
  db = createTestDb();
  clock.set(new Date('2026-03-01T10:00:00.000Z'));
});

const arrive = (id: string, level: TriageLevel, minutesAgo: number) =>
  db
    .insert(visits)
    .values({
      id,
      patientName: id,
      level,
      status: 'WAITING',
      arrivedAt: new Date(clock.now().getTime() - minutesAgo * 60_000),
    })
    .run();

const post = (app: ReturnType<typeof createApp>, path: string, body: unknown) =>
  app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/queue', () => {
  it('returns waiting patients in triage order with position and estimate', async () => {
    arrive('green-first', 'GREEN', 60);
    arrive('green-second', 'GREEN', 30);
    arrive('red', 'RED', 5);

    const response = await createApp({ db, clock }).request('/api/queue');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entries.map((e: { id: string }) => e.id)).toEqual([
      'red',
      'green-first',
      'green-second',
    ]);
    expect(body.entries[1].position).toBe(2);
    expect(body.entries[1].estimatedWaitMinutes).toBe(30);
  });

  it('excludes patients who are no longer waiting', async () => {
    arrive('waiting', 'GREEN', 10);
    arrive('gone', 'GREEN', 20);
    db.update(visits).set({ status: 'DONE' }).where(eq(visits.id, 'gone')).run();

    const body = await (await createApp({ db, clock }).request('/api/queue')).json();

    expect(body.entries.map((e: { id: string }) => e.id)).toEqual(['waiting']);
  });
});

describe('GET /api/visits/:id', () => {
  it('returns that patient position and estimate', async () => {
    arrive('a', 'GREEN', 60);
    arrive('b', 'GREEN', 30);

    const body = await (await createApp({ db, clock }).request('/api/visits/b')).json();

    expect(body.position).toBe(2);
    expect(body.estimatedWaitMinutes).toBe(15);
  });

  it('returns 404 for an unknown visit', async () => {
    const response = await createApp({ db, clock }).request('/api/visits/nobody');

    expect(response.status).toBe(404);
  });
});

describe('staff actions', () => {
  it('registers an arrival at the current clock time', async () => {
    const created = await post(createApp({ db, clock }), '/api/visits', {
      patientName: 'Nils Aas',
      level: 'YELLOW',
    });
    const { id } = await created.json();

    expect(created.status).toBe(201);
    expect(
      db.select().from(visits).where(eq(visits.id, id)).get()?.arrivedAt.toISOString(),
    ).toBe('2026-03-01T10:00:00.000Z');
  });

  it('rejects an unknown triage level with 400', async () => {
    const response = await post(createApp({ db, clock }), '/api/visits', {
      patientName: 'Nils Aas',
      level: 'PURPLE',
    });

    expect(response.status).toBe(400);
  });

  it('returns 400, not 500, for malformed JSON', async () => {
    const response = await createApp({ db, clock }).request('/api/visits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ not json',
    });

    expect(response.status).toBe(400);
  });

  it('re-triage moves a patient up the queue and records the change', async () => {
    arrive('green', 'GREEN', 60);
    arrive('blue', 'BLUE', 10);
    const app = createApp({ db, clock });

    await post(app, '/api/visits/blue/triage', { level: 'RED' });

    const body = await (await app.request('/api/queue')).json();
    expect(body.entries[0].id).toBe('blue');
    expect(db.select().from(triageEvents).all()).toHaveLength(1);
  });
});

describe('test-only routes', () => {
  it('are absent unless test routes are allowed', async () => {
    const response = await post(createApp({ db, clock }), '/api/test/reset', {});

    expect(response.status).toBe(404);
  });

  it('reset empties the queue when allowed', async () => {
    arrive('someone', 'GREEN', 10);
    const app = createApp({ db, clock, allowTestRoutes: true });

    await post(app, '/api/test/reset', {});

    expect((await (await app.request('/api/queue')).json()).entries).toHaveLength(0);
  });
});
