import path from 'node:path';
import { git } from '../worker/git.js';
import { getConfig } from '../config.js';
import { baseBranch } from './projects/baseBranch.js';

// Diff результата задачи. Если запуск отправил коммиты прямо в основную ветку (diffRange), показываем именно их.
// Иначе diff ветки задачи относительно основной ветки проекта.
export async function taskDiff(task) {
  const repo = path.join(getConfig().worker.reposDir, task.project);
  const { from, to } = task.diffRange ?? {};
  if (from && to) return (await git(repo, ['diff', `${from}..${to}`])).slice(0, 300000);
  const base = await baseBranch(task.project);
  const diff = await git(repo, ['diff', `origin/${base}...${task.branch}`]);
  return diff.slice(0, 300000);
}
