import path from 'node:path';
import { git } from '../worker/git.js';

// Diff ветки задачи относительно основной ветки проекта
export async function taskDiff(task) {
  const repo = path.join(process.env.REPOS_DIR, task.project);
  const base = process.env.DEFAULT_BRANCH || 'main';
  const diff = await git(repo, ['diff', `origin/${base}...${task.branch}`]);
  return diff.slice(0, 300000);
}
