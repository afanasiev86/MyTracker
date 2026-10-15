import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCommand } from './runCommand.js';
import { INSTALL_TIMEOUT_MS } from './config.js';

const MARKER = path.join('node_modules', '.mytracker-deps');

const depsHash = async (wt) => {
  const hash = crypto.createHash('sha1');
  for (const name of ['package.json', 'package-lock.json']) {
    hash.update(await fs.readFile(path.join(wt, name)).catch(() => ''));
  }
  return hash.digest('hex');
};

// node_modules живёт в клоне между запусками: ставим зависимости заново, только если package.json или lock изменились
export async function ensureDependencies(wt) {
  const hash = await depsHash(wt);
  const marker = path.join(wt, MARKER);
  if (await fs.readFile(marker, 'utf8').then((saved) => saved === hash, () => false)) return;
  const hasLock = await fs.access(path.join(wt, 'package-lock.json')).then(() => true, () => false);
  const args = hasLock ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund'];
  const { code, output } = await runCommand('npm', args, wt, INSTALL_TIMEOUT_MS);
  if (code !== 0) throw new Error(`не удалось установить зависимости: ${output.slice(-500)}`);
  await fs.mkdir(path.dirname(marker), { recursive: true });
  await fs.writeFile(marker, hash);
}
