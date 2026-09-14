import { randomUUID } from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import {
  changeStatusSchema,
  registerArrivalSchema,
  retriageSchema,
} from 'contract';
import { eq, ne } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import type { Clock } from '../clock.ts';
import type { Db } from '../db/client.ts';
import { triageEvents, visits } from '../db/schema.ts';
import { seedDemoData } from '../db/seed.ts';
import {
  estimatedWaitMinutes,
  orderQueue,
  positionOf,
  roomIsFree,
  type WaitingVisit,
} from '../domain/queue.ts';

export type AppDeps = {
  db: Db;
  clock: Clock;
  allowTestRoutes?: boolean;
};

type WaitingRow = WaitingVisit & { patientName: string };

function waitingVisits(db: Db): WaitingRow[] {
  return db
    .select()
    .from(visits)
    .where(eq(visits.status, 'WAITING'))
    .all()
    .map((row) => ({
      id: row.id,
      patientName: row.patientName,
      level: row.level,
      arrivedAt: row.arrivedAt,
    }));
}

/** The one patient in the consultation room, or null while it is free. */
function roomOccupant(db: Db) {
  const row = db.select().from(visits).where(eq(visits.status, 'IN_CONSULTATION')).get();
  return row ? { id: row.id, patientName: row.patientName, level: row.level } : null;
}

export function createApp(deps: AppDeps) {
  const app = new Hono();

  app.use('/api/*', cors());

  app.onError((error, c) => {
    // Deliberate ordering: HTTPException carries its own status — notably the
    // 400 the validator throws for malformed JSON. Swallowing it into a 500
    // would turn a precise client error into an opaque server error.
    if (error instanceof HTTPException) return error.getResponse();

    console.error(error);
    return c.json({ error: 'internal server error' }, 500);
  });

  app.get('/api/queue', (c) => {
    const waiting = waitingVisits(deps.db);
    const occupant = roomOccupant(deps.db);
    const byId = new Map(waiting.map((row) => [row.id, row]));

    const entries = orderQueue(waiting).map((visit, index) => ({
      id: visit.id,
      patientName: byId.get(visit.id)?.patientName ?? '',
      level: visit.level,
      position: index + 1,
      estimatedWaitMinutes: estimatedWaitMinutes(waiting, visit.id, occupant) ?? 0,
    }));

    return c.json({ now: deps.clock.now().toISOString(), entries, inConsultation: occupant });
  });

  app.get('/api/visits/:id', (c) => {
    const id = c.req.param('id');
    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    const waiting = waitingVisits(deps.db);
    const occupant = roomOccupant(deps.db);

    return c.json({
      id: row.id,
      patientName: row.patientName,
      level: row.level,
      status: row.status,
      position: positionOf(waiting, id),
      estimatedWaitMinutes: estimatedWaitMinutes(waiting, id, occupant),
    });
  });

  app.post('/api/visits', zValidator('json', registerArrivalSchema), (c) => {
    const { patientName, level } = c.req.valid('json');
    const id = randomUUID();

    deps.db
      .insert(visits)
      .values({ id, patientName, level, status: 'WAITING', arrivedAt: deps.clock.now() })
      .run();

    return c.json({ id }, 201);
  });

  app.post('/api/visits/:id/triage', zValidator('json', retriageSchema), (c) => {
    const id = c.req.param('id');
    const { level } = c.req.valid('json');

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    // Two writes, one fact: the level change and its history entry must be
    // atomic, because the queue-aging amendment depends on that history.
    // The callback MUST be synchronous — better-sqlite3 rejects an async one.
    deps.db.transaction((tx) => {
      tx.update(visits).set({ level }).where(eq(visits.id, id)).run();
      tx.insert(triageEvents)
        .values({
          id: randomUUID(),
          visitId: id,
          fromLevel: row.level,
          toLevel: level,
          occurredAt: deps.clock.now(),
        })
        .run();
    });

    return c.json({ id, level });
  });

  app.post('/api/visits/:id/status', zValidator('json', changeStatusSchema), (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    const row = deps.db.select().from(visits).where(eq(visits.id, id)).get();
    if (!row) return c.json({ error: 'visit not found' }, 404);

    // One room. Setting the patient who is already in it again is fine.
    if (status === 'IN_CONSULTATION') {
      const others = deps.db.select().from(visits).where(ne(visits.id, id)).all();
      if (!roomIsFree(others)) return c.json({ error: 'room is taken' }, 409);
    }

    deps.db.update(visits).set({ status }).where(eq(visits.id, id)).run();
    return c.json({ id, status });
  });

  if (deps.allowTestRoutes) {
    app.post('/api/test/clock', zValidator('json', z.object({ now: z.string() })), (c) => {
      const { now } = c.req.valid('json');
      const parsed = new Date(now);
      if (Number.isNaN(parsed.getTime())) return c.json({ error: 'invalid date' }, 400);

      const settable = deps.clock as { set?: (next: Date) => void };
      if (!settable.set) return c.json({ error: 'clock is not settable' }, 400);

      settable.set(parsed);
      return c.json({ now });
    });

    // One call to put the system in a known state, instead of N+1 requests
    // from a step definition. Scenarios become independent.
    app.post('/api/test/reset', (c) => {
      deps.db.transaction((tx) => {
        tx.delete(triageEvents).run();
        tx.delete(visits).run();
      });
      return c.json({ ok: true });
    });

    app.post('/api/test/seed', (c) => {
      seedDemoData(deps.db, deps.clock);
      return c.json({ ok: true });
    });
  }

  return app;
}
