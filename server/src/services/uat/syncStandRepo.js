import fs from 'node:fs/promises';
import path from 'node:path';
import { git } from '../../worker/git.js';

// Забирает ветку UAT в папку стенда: <папка>/repo. Это отдельный клон, а не клон, где работает Claude.
// Возвращает короткий хеш собранного коммита. Ошибки git (нет ветки, нет доступа) выбрасываются как есть.
export async function syncStandRepo(dir, { repoUrl, uatBranch }) {
  const branch = uatBranch || 'uat';
  const repo = path.posix.join(dir, 'repo');
  if (await fs.access(path.posix.join(repo, '.git')).then(() => true, () => false)) {
    await git(repo, ['fetch', 'origin', branch]);
    await git(repo, ['checkout', '-f', '-B', branch, `origin/${branch}`]);
    await git(repo, ['clean', '-fd']);
  } else {
    await fs.rm(repo, { recursive: true, force: true });
    await git(dir, ['-c', 'protocol.ext.allow=never', '-c', 'protocol.file.allow=never', 'clone', '--branch', branch, '--', repoUrl, 'repo']);
  }
  return (await git(repo, ['rev-parse', '--short', 'HEAD'])).trim();
}
