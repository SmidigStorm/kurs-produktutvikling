import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';
import { createDb } from './client.ts';
import { visits } from './schema.ts';

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

it('deletes the database and sidecars before opening, then migrates and seeds it', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'queue-reset-'));
  const file = join(directory, 'queue.sqlite');
  const message = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubEnv('DB_FILE', relative(repoRoot, file));
  vi.doMock('./client.ts', () => ({
    createDb: (path: string) => {
      expect(path).toBe(file);
      for (const suffix of ['', '-wal', '-shm']) {
        expect(existsSync(`${path}${suffix}`)).toBe(false);
      }
      return createDb(path);
    },
  }));

  try {
    for (const suffix of ['', '-wal', '-shm']) {
      writeFileSync(`${file}${suffix}`, 'old database contents');
    }

    await import('./reset-entry.ts');

    expect(message).toHaveBeenCalledWith(`Reset complete. Database recreated at ${file}`);
    const db = createDb(file);
    try {
      expect(db.select().from(visits).all()).toHaveLength(5);
    } finally {
      db.$client.close();
    }
  } finally {
    vi.doUnmock('./client.ts');
    vi.unstubAllEnvs();
    message.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  }
});
