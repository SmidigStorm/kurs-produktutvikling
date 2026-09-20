import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './api/app.ts';
import { fixedClock, scaledClock, systemClock, type Clock, type ScaledClock } from './clock.ts';
import { createDb } from './db/client.ts';
import { resolveDbFile } from './db/paths.ts';
import { applyMigrations } from './db/migrate.ts';
import { runSimulation } from './simulation/loop.ts';

const file = resolveDbFile();
const port = Number(process.env.PORT ?? 3001);
const allowTestRoutes = process.env.ALLOW_TEST_ROUTES === 'true';

// The classroom simulation: the queue moves by itself on a scaled clock.
// `npm run dev` turns it on; the test suite never does.
const simulate = process.env.SIMULATE === 'true';
const simulationSpeed = Number(process.env.SIMULATION_SPEED ?? 60);

mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);

const simulation: ScaledClock | undefined = simulate ? scaledClock(new Date(), simulationSpeed) : undefined;

// Paused on purpose. The queue the room is shown at startup is the seeded one,
// five patients waiting; it starts moving when someone presses Run in the staff
// view's Simulation panel.
simulation?.setRunning(false);

const fixed = process.env.CLOCK_FIXED_AT
  ? fixedClock(new Date(process.env.CLOCK_FIXED_AT))
  : undefined;
const test = allowTestRoutes ? { clock: fixed ?? fixedClock(systemClock.now()) } : undefined;
const clock: Clock = test?.clock ?? fixed ?? simulation ?? systemClock;

if (simulation) {
  runSimulation({ db, clock: simulation, random: Math.random, intervalMs: 250 });
}

serve({ fetch: createApp({ db, clock, test, simulation }).fetch, port }, (info) => {
  console.log(`Backend listening on http://localhost:${info.port}`);
  if (simulation) console.log(`Simulation paused at ${simulationSpeed}x. Press Run in the staff view.`);
});
