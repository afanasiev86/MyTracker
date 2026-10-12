import fs from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from './runCommand.js';
import { INSTALL_TIMEOUT_MS } from './config.js';

// В свежей рабочей копии нет node_modules: ставим зависимости один раз
export async function ensureDependencies(wt) {
  try {
    await fs.access(path.join(wt, 'node_modules'));
    return;
  } catch {
    // нет node_modules — ставим ниже
  }
  const hasLock = await fs.access(path.join(wt, 'package-lock.json')).then(() => true, () => false);
  const args = hasLock ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund'];
  const { code, output } = await runCommand('npm', args, wt, INSTALL_TIMEOUT_MS);
  if (code !== 0) throw new Error(`не удалось установить зависимости: ${output.slice(-500)}`);
}
