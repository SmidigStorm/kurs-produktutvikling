#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const failures = [];

const check = (label, fn) => {
  try {
    fn();
    console.log(`  ok    ${label}`);
  } catch (cause) {
    console.log(`  FAIL  ${label}`);
    failures.push(`${label}: ${cause instanceof Error ? cause.message : String(cause)}`);
  }
};

console.log('Checking your setup...\n');

check('Node is version 22 or newer', () => {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) throw new Error(`found Node ${process.versions.node}`);
});

check('Dependencies are installed', () => {
  if (!existsSync('node_modules')) throw new Error('run: npm install');
});

check('The SQLite binding loads', () => {
  execFileSync(process.execPath, ['-e', "require('better-sqlite3')"], { stdio: 'pipe' });
});

check('TypeScript compiles', () => {
  execFileSync('npm', ['run', 'typecheck'], { stdio: 'pipe', shell: true });
});

check('Unit tests pass', () => {
  execFileSync('npm', ['test'], { stdio: 'pipe', shell: true });
});

check('A browser is installed for Playwright', () => {
  execFileSync('npx', ['playwright', 'install', '--dry-run', 'chromium'], {
    stdio: 'pipe',
    shell: true,
  });
});

if (failures.length === 0) {
  console.log('\nPASS — you are ready for the course.');
  process.exit(0);
}

console.log(`\nFAIL — ${failures.length} problem(s):\n`);
failures.forEach((failure, index) => console.log(`  ${index + 1}. ${failure}`));
console.log('\nBring this output to class if you cannot resolve it.');
process.exit(1);
