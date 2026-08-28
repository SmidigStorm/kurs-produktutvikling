#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Same resolution as the server: repo root, never the current directory.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(repoRoot, process.env.DB_FILE ?? 'data/legevakt.sqlite');

for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${file}${suffix}`, { force: true });
}

execFileSync(process.execPath, ['backend/src/db/reset-entry.ts'], {
  stdio: 'inherit',
  env: { ...process.env, DB_FILE: file },
});

console.log(`Reset complete. Database recreated at ${file}`);
