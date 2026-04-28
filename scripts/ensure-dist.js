#!/usr/bin/env node
/**
 * Pre-dev guard: wrangler dev's [site] bucket is ./dist. On a fresh clone
 * the directory doesn't exist yet, so we run `vite build` once to seed it.
 * Subsequent runs are skipped because dist/index.html already exists.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (existsSync('dist/index.html')) {
  process.exit(0);
}

console.log('[predev] dist/ missing; running initial vite build...');
const result = spawnSync('npx', ['vite', 'build'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
