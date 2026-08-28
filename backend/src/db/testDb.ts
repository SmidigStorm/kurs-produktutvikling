import { createDb, type Db } from './client.js';
import { applyMigrations } from './migrate.js';

/**
 * A fresh, private, migrated database per call.
 *
 * ':memory:' is not merely faster than a temp file — it makes "tests must never
 * touch the development database" physically impossible to violate, rather than a
 * setting someone has to remember. It also avoids the Windows EBUSY that a temp
 * file causes when the connection is still open at cleanup.
 */
export function createTestDb(): Db {
  const db = createDb(':memory:');
  applyMigrations(db);
  return db;
}
