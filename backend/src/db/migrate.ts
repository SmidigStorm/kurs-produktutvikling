import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type { Db } from './client.ts';

const migrationsFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export function applyMigrations(db: Db): void {
  migrate(db, { migrationsFolder });
}
