import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// backend/src/db/paths.ts -> repo root
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Resolve the database file against the repo root, never the current directory.
 *
 * npm runs a workspace script with cwd set to that workspace, so a bare
 * "data/legevakt.sqlite" means backend/data/... when the server starts and
 * ./data/... when `npm run reset` runs from the root — two different databases,
 * and a reset that appears to do nothing.
 */
export function resolveDbFile(): string {
  return resolve(repoRoot, process.env.DB_FILE ?? 'data/legevakt.sqlite');
}
