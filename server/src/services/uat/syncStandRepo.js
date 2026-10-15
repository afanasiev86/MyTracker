import fs from 'node:fs/promises';
import path from 'node:path';
import { git } from '../../worker/git.js';
import { ensureRemoteBranch } from '../../worker/worktree.js';

// Забирает ветку UAT в папку стенда: <папка>/repo. Это отдельный клон, а не клон, где работает Claude.
// Если ветки UAT в origin ещё нет (стенд запущен до первой задачи), она создаётся от основной ветки base.
// Возвращает короткий хеш собранного коммита. Ошибки git (нет доступа к GitHub) выбрасываются как есть.
export async function syncStandRepo(dir, { repoUrl, uatBranch, base }) {
  const branch = uatBranch || 'uat';
  const repo = path.posix.join(dir, 'repo');
  if (await fs.access(path.posix.join(repo, '.git')).then(() => true, () => false)) {
    await git(repo, ['fetch', 'origin']);
  } else {
    await fs.rm(repo, { recursive: true, force: true });
    await git(dir, ['-c', 'protocol.ext.allow=never', '-c', 'protocol.file.allow=never', 'clone', '--', repoUrl, 'repo']);
  }
  await ensureRemoteBranch(repo, branch, base);
  await git(repo, ['checkout', '-f', '-B', branch, `origin/${branch}`]);
  await git(repo, ['clean', '-fd']);
  return (await git(repo, ['rev-parse', '--short', 'HEAD'])).trim();
}
