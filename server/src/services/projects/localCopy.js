import fs from 'node:fs/promises';
import path from 'node:path';
import { getConfig } from '../../config.js';
import { run } from '../ops/exec.js';
import { opsAvailable } from '../ops/platform.js';

// Локальный клон проекта на сервере: есть ли папка, где она лежит и сколько занимает (вместе с node_modules).
// Размер считает du, поэтому вне Linux-сервера он не определяется (sizeBytes: null).
export async function localCopy(slug) {
  const { reposDir } = getConfig().worker;
  if (!reposDir) return { configured: false };
  const dir = path.join(reposDir, slug);
  const exists = await fs.access(dir).then(() => true, () => false);
  if (!exists) return { configured: true, path: dir, exists: false, sizeBytes: 0 };
  if (!opsAvailable()) return { configured: true, path: dir, exists: true, sizeBytes: null };
  const du = await run('du', ['-sb', dir], { timeoutMs: 30000 });
  const sizeBytes = du.ok ? Number(du.stdout.split('\t')[0]) : null;
  return { configured: true, path: dir, exists: true, sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : null };
}
