import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { systemClock } from '../clock.ts';
import { createDb } from './client.ts';
import { resolveDbFile } from './paths.ts';
import { applyMigrations } from './migrate.ts';
import { seedDemoData } from './seed.ts';

const file = resolveDbFile();
mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);
seedDemoData(db, systemClock);
