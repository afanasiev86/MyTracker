import fs from 'node:fs/promises';
import { git } from './git.js';

// Если у git на сервере не настроено имя автора, commit и rebase падают («Committer identity unknown»).
// Задаём имя только в этом репозитории и только если его нет ни в глобальной, ни в системной настройке.
export async function ensureGitIdentity(repo) {
  const isSet = async (key) => (await git(repo, ['config', '--get', key]).catch(() => '')).trim() !== '';
  if (!(await isSet('user.name'))) await git(repo, ['config', 'user.name', 'Claude (MyTracker)']);
  if (!(await isSet('user.email'))) await git(repo, ['config', 'user.email', 'claude@mytracker.local']);
}

// Готовит отдельную рабочую копию под задачу.
// Если ветка уже есть в origin (продолжение после вопроса или доработка), продолжаем с неё,
// иначе начинаем от основной ветки проекта base.
export async function prepareWorktree(repo, branch, wt, base) {
  await ensureGitIdentity(repo);
  await git(repo, ['fetch', 'origin']);
  const remote = (await git(repo, ['ls-remote', '--heads', 'origin', branch])).trim();
  const startPoint = remote ? `origin/${branch}` : `origin/${base}`;

  await git(repo, ['worktree', 'remove', '--force', wt]).catch(() => {});
  await fs.rm(wt, { recursive: true, force: true });
  await git(repo, ['worktree', 'prune']);
  await git(repo, ['worktree', 'add', '-B', branch, wt, startPoint]);
  return startPoint;
}

// Сколько коммитов Claude сделал поверх точки старта
export async function countNewCommits(wt, startPoint) {
  return Number((await git(wt, ['rev-list', '--count', `${startPoint}..HEAD`])).trim());
}
