import path from 'node:path';
import { git } from '../worker/git.js';
import { getConfig } from '../config.js';
import { baseBranch } from './projects/baseBranch.js';

// Diff ветки задачи относительно основной ветки проекта
export async function taskDiff(task) {
  const repo = path.join(getConfig().worker.reposDir, task.project);
  const base = await baseBranch(task.project);
  const diff = await git(repo, ['diff', `origin/${base}...${task.branch}`]);
  return diff.slice(0, 300000);
}
