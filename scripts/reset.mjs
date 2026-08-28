#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const file = process.env.DB_FILE ?? 'data/legevakt.sqlite';

for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${file}${suffix}`, { force: true });
}

execFileSync(process.execPath, ['backend/src/db/reset-entry.ts'], {
  stdio: 'inherit',
  env: { ...process.env, DB_FILE: file },
});

console.log(`Reset complete. Database recreated at ${file}`);
