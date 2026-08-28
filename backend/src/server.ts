import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './api/app.ts';
import { fixedClock, systemClock, type Clock } from './clock.ts';
import { createDb } from './db/client.ts';
import { applyMigrations } from './db/migrate.ts';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';
const port = Number(process.env.PORT ?? 3001);
const allowTestRoutes = process.env.ALLOW_TEST_ROUTES === 'true';

mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);

const clock: Clock = process.env.CLOCK_FIXED_AT
  ? fixedClock(new Date(process.env.CLOCK_FIXED_AT))
  : systemClock;

serve({ fetch: createApp({ db, clock, allowTestRoutes }).fetch, port }, (info) => {
  console.log(`Backend listening on http://localhost:${info.port}`);
});
