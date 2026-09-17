import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { systemClock } from '../clock.ts';
import { createDb } from './client.ts';
import { resolveDbFile } from './paths.ts';
import { applyMigrations } from './migrate.ts';
import { seedDemoData } from './seed.ts';

const file = resolveDbFile();
for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${file}${suffix}`, { force: true });
}
mkdirSync(dirname(file), { recursive: true });

const db = createDb(file);
applyMigrations(db);
seedDemoData(db, systemClock);
db.$client.close();

console.log(`Reset complete. Database recreated at ${file}`);
