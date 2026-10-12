import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Task from '../models/Task.js';
import { issueToken } from '../services/auth.js';
import { notify } from '../services/notify.js';
import { STATUS_LABELS } from '../../../shared/statuses.js';
import { git } from './git.js';
import { isLimitError } from './limits.js';

// Инструменты, которые Claude может использовать без подтверждения
const CLAUDE_TOOLS = 'Read Edit Write Bash(git *) Bash(npm *) Bash(npx *) Bash(curl *)';

const ICONS = { review: '🔍', failed: '❌', ready: '⏸' };

function config() {
  return {
    reposDir: process.env.REPOS_DIR,
    worktreesDir: process.env.WORKTREES_DIR,
    base: process.env.DEFAULT_BRANCH || 'main',
    claudeBin: process.env.CLAUDE_BIN || 'claude',
    apiUrl: process.env.TRACKER_API_URL || `http://localhost:${process.env.PORT || 3001}/api`,
  };
}

function runClaude(bin, args, { cwd, env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function parseOutput(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

// Готовит отдельную рабочую копию под задачу.
// Если ветка уже есть в origin (повторный запуск после проверки), продолжаем с неё.
async function prepareWorktree(cfg, repo, branch, wt) {
  await git(repo, ['fetch', 'origin']);
  const remote = (await git(repo, ['ls-remote', '--heads', 'origin', branch])).trim();
  const startPoint = remote ? `origin/${branch}` : `origin/${cfg.base}`;

  await git(repo, ['worktree', 'remove', '--force', wt]).catch(() => {});
  await fs.rm(wt, { recursive: true, force: true });
  await git(repo, ['worktree', 'prune']);
  await git(repo, ['worktree', 'add', '-B', branch, wt, startPoint]);
  return startPoint;
}

export async function runTask(taskId) {
  const cfg = config();
  const task = await Task.findById(taskId);
  if (!task || task.status !== 'in_progress') return;

  const branch = `task/${task._id}`;
  const repo = path.join(cfg.reposDir, task.project);
  const wt = path.join(cfg.worktreesDir, String(task._id));
  const startedAt = new Date();
  let outcome;

  try {
    const startPoint = await prepareWorktree(cfg, repo, branch, wt);
    const env = {
      ...process.env,
      TRACKER_API: cfg.apiUrl,
      TRACKER_TOKEN: issueToken('worker', '2h'),
    };
    const res = await runClaude(
      cfg.claudeBin,
      ['-p', `/implement-task ${task._id}`, '--output-format', 'json', '--allowedTools', CLAUDE_TOOLS],
      { cwd: wt, env },
    );
    const data = parseOutput(res.stdout);
    const log = `${res.stdout}\n${res.stderr}`.slice(-20000);
    const costUsd = data?.total_cost_usd;

    if (isLimitError(res.stdout) || isLimitError(res.stderr)) {
      outcome = {
        status: 'ready',
        summary: 'Достигнут лимит Claude. Задача возвращена в «Готово к работе», запустите её позже.',
        costUsd,
        log,
      };
    } else if (res.code !== 0 || data?.is_error) {
      outcome = {
        status: 'failed',
        summary: data?.result || res.stderr.slice(-2000) || 'Claude завершился с ошибкой',
        costUsd,
        log,
      };
    } else {
      const newCommits = Number(
        (await git(wt, ['rev-list', '--count', `${startPoint}..HEAD`])).trim(),
      );
      if (newCommits === 0) {
        outcome = { status: 'failed', summary: 'Claude не создал коммитов.', costUsd, log };
      } else {
        await git(wt, ['push', '-u', 'origin', branch]);
        outcome = { status: 'review', summary: data?.result || 'Готово к проверке', costUsd, log };
      }
    }
  } catch (err) {
    outcome = {
      status: 'failed',
      summary: `Ошибка воркера: ${err.message}`.slice(0, 2000),
      log: err.stack,
    };
  }

  task.status = outcome.status;
  task.branch = branch;
  task.runs.push({
    startedAt,
    finishedAt: new Date(),
    summary: outcome.summary,
    costUsd: outcome.costUsd,
    log: outcome.log,
  });
  await task.save();

  await git(repo, ['worktree', 'remove', '--force', wt]).catch(() => {});

  await notify(
    `${ICONS[task.status] ?? 'ℹ️'} ${task.project}: ${task.title}\n` +
    `Статус: ${STATUS_LABELS[task.status]}\n` +
    `${outcome.summary.slice(0, 800)}\n` +
    `ID: ${task._id}`,
  );
}
