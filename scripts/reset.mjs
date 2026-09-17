#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

execFileSync(process.execPath, [fileURLToPath(new URL('../backend/src/db/reset-entry.ts', import.meta.url))], {
  stdio: 'inherit',
});
