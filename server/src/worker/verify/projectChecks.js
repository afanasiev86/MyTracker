import fs from 'node:fs/promises';
import path from 'node:path';
import { CHECK_NAMES } from './config.js';

// Какие проверки есть в проекте
export async function projectChecks(wt) {
  let pkg;
  try {
    pkg = JSON.parse(await fs.readFile(path.join(wt, 'package.json'), 'utf8'));
  } catch {
    return [];
  }
  const scripts = pkg.scripts || {};
  return CHECK_NAMES.filter((name) => scripts[name]);
}
