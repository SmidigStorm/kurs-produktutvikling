import type { TriageLevel } from 'contract';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { fixedClock, scaledClock } from '../clock.ts';
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

  it.each(['DONE', 'IN_CONSULTATION'] as const)('returns null queue annotations for %s', async (status) => {
    arrive('a', 'GREEN', 60);
    db.update(visits).set({ status }).where(eq(visits.id, 'a')).run();

    const body = await (await createApp({ db, clock }).request('/api/visits/a')).json();

    expect(body.position).toBeNull();
    expect(body.estimatedWaitMinutes).toBeNull();
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

describe('the consultation room', () => {
  const callIn = (id: string) =>
    db.update(visits).set({ status: 'IN_CONSULTATION' }).where(eq(visits.id, id)).run();

  it('is reported free in the queue response while nobody is in consultation', async () => {
    arrive('kari', 'GREEN', 60);

    const body = await (await createApp({ db, clock }).request('/api/queue')).json();

    expect(body.inConsultation).toBeNull();
  });

  it('names the patient in consultation, who is no longer a queue entry', async () => {
    arrive('kari', 'GREEN', 60);
    arrive('ola', 'GREEN', 30);
    callIn('kari');

    const body = await (await createApp({ db, clock }).request('/api/queue')).json();

    expect(body.inConsultation).toEqual({ id: 'kari', patientName: 'kari', level: 'GREEN' });
    expect(body.entries.map((e: { id: string }) => e.id)).toEqual(['ola']);
  });

  it('counts the patient in the room as ahead of everyone waiting', async () => {
    arrive('kari', 'GREEN', 60);
    arrive('ola', 'GREEN', 30);
    callIn('kari');
    const app = createApp({ db, clock });

    const visit = await (await app.request('/api/visits/ola')).json();
    const queue = await (await app.request('/api/queue')).json();

    expect(visit.position).toBe(1);
    expect(visit.estimatedWaitMinutes).toBe(15);
    expect(queue.entries[0].estimatedWaitMinutes).toBe(15);
  });

  it('refuses a second patient in consultation with 409 while the room is taken', async () => {
    arrive('kari', 'GREEN', 60);
    arrive('ola', 'GREEN', 30);
    callIn('kari');

    const response = await post(createApp({ db, clock }), '/api/visits/ola/status', {
      status: 'IN_CONSULTATION',
    });

    expect(response.status).toBe(409);
    expect(db.select().from(visits).where(eq(visits.id, 'ola')).get()?.status).toBe('WAITING');
  });

  it('accepts the patient already in the room being set to in consultation again', async () => {
    arrive('kari', 'GREEN', 60);
    callIn('kari');

    const response = await post(createApp({ db, clock }), '/api/visits/kari/status', {
      status: 'IN_CONSULTATION',
    });

    expect(response.status).toBe(200);
  });
});

describe('test-only routes', () => {
  it.each(['reset', 'clock', 'seed'])('leaves /api/test/%s absent without test configuration', async (route) => {
    const response = await post(createApp({ db, clock }), `/api/test/${route}`, {});

    expect(response.status).toBe(404);
  });

  it('sets the configured test clock, which subsequent requests observe', async () => {
    const app = createApp({ db, clock, test: { clock } });
    const now = '2026-03-02T12:00:00.000Z';

    expect((await post(app, '/api/test/clock', { now })).status).toBe(200);
    expect((await (await app.request('/api/queue')).json()).now).toBe(now);
  });

  it('rejects an invalid date without changing the clock', async () => {
    const app = createApp({ db, clock, test: { clock } });
    const before = clock.now();

    expect((await post(app, '/api/test/clock', { now: 'invalid' })).status).toBe(400);
    expect(clock.now()).toEqual(before);
  });

  it('reset empties the queue when allowed', async () => {
    arrive('someone', 'GREEN', 10);
    const app = createApp({ db, clock, test: { clock } });

    await post(app, '/api/test/reset', {});

    expect((await (await app.request('/api/queue')).json()).entries).toHaveLength(0);
  });
});

describe('the simulation controls', () => {
  it('are absent unless the server runs the simulation', async () => {
    const response = await createApp({ db, clock }).request('/api/simulation');

    expect(response.status).toBe(404);
  });

  it('report and change speed and running', async () => {
    const simulation = scaledClock(clock.now(), 60);
    const app = createApp({ db, clock: simulation, simulation });

    expect(await (await app.request('/api/simulation')).json()).toEqual({ running: true, speed: 60 });

    const changed = await post(app, '/api/simulation', { speed: 120, running: false });

    expect(await changed.json()).toEqual({ running: false, speed: 120 });
    expect(simulation.speed()).toBe(120);
    expect(simulation.running()).toBe(false);
  });

  it('reject a speed that is not positive', async () => {
    const simulation = scaledClock(clock.now(), 60);
    const response = await post(createApp({ db, clock: simulation, simulation }), '/api/simulation', {
      speed: 0,
    });

    expect(response.status).toBe(400);
  });
});
