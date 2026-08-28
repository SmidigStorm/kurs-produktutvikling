#!/usr/bin/env node
import { spawn } from 'node:child_process';

const children = [
  spawn('npm', ['run', 'dev', '-w', 'backend'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev', '-w', 'frontend'], { stdio: 'inherit', shell: true }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => code !== 0 && stop()));
