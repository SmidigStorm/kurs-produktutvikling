#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const lockfile = readFileSync('package-lock.json', 'utf8');
const banned = ['node-gyp', 'nan'];
const found = banned.filter((name) => lockfile.includes(`"node_modules/${name}"`));

if (found.length > 0) {
  console.error(`FAIL — these force native compilation at install time: ${found.join(', ')}`);
  console.error('Setup must not require a C++ toolchain. Find a prebuilt alternative.');
  process.exit(1);
}

console.log('ok — no dependency requires native compilation');
