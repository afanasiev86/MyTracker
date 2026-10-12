import fs from 'node:fs/promises';
import { git } from './git.js';

// Готовит отдельную рабочую копию под задачу.
// Если ветка уже есть в origin (продолжение после вопроса или доработка), продолжаем с неё.
export async function prepareWorktree(cfg, repo, branch, wt) {
  await git(repo, ['fetch', 'origin']);
  const remote = (await git(repo, ['ls-remote', '--heads', 'origin', branch])).trim();
  const startPoint = remote ? `origin/${branch}` : `origin/${cfg.base}`;

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
