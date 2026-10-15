import path from 'node:path';
import Task from '../models/Task.js';
import { issueToken } from '../services/auth/tokens.js';
import { git } from './git.js';
import { materializeScreenshots } from './screenshots/materializeScreenshots.js';
import { formatChecks } from './verify/formatChecks.js';
import { findResult } from './progress/findResult.js';
import { workerConfig } from './config.js';
import { TRACKER_CLI } from './claudeTools.js';
import { launchArgs } from './launchArgs.js';
import { runClaude } from './claudeProcess.js';
import { prepareWorktree } from './worktree.js';
import { branchSettings } from '../services/projects/baseBranch.js';
import { resolveOutcome } from './outcome.js';
import { notifyRunFinished } from './notifyRun.js';
import { childEnv, gitAccessHint } from './env.js';

// Один запуск задачи: рабочая копия, claude, исход, запись в задачу, уведомление.
// options.answer — ответ владельца на вопрос Claude. Продолжаем ту же сессию.
export async function runTask(taskId, { answer = null } = {}) {
  const cfg = workerConfig();
  const task = await Task.findById(taskId);
  if (!task || task.status !== 'in_progress') return;
  // Запуск взят из очереди: в базе он больше не ждёт
  if (task.queued) {
    task.queued = false;
    task.queuedAnswer = '';
    await task.save();
  }

  const branch = `task/${task._id}`;
  const repo = path.join(cfg.reposDir, task.project);
  const wt = path.join(cfg.worktreesDir, String(task._id));
  const startedAt = new Date();
  let outcome;

  try {
    const { base, direct } = await branchSettings(task.project);
    const startPoint = await prepareWorktree(repo, branch, wt, base);
    // Скриншоты задачи: если не удалось скачать, запуск идёт без них
    const screenshots = await materializeScreenshots(task, wt).catch((err) => {
      console.error('Скриншоты:', err.message);
      return [];
    });
    const env = {
      ...childEnv(),
      TRACKER_API: cfg.apiUrl,
      TRACKER_TOKEN: await issueToken('worker', '2h'),
      TRACKER_CLI,
    };
    const args = launchArgs({ taskId: task._id, answer, sessionId: task.sessionId, screenshots });

    // Записи прогресса идут по очереди, чтобы не перезаписать финальный статус
    let writes = Task.updateOne({ _id: task._id }, { progress: 'Запуск…' }).catch(() => {});
    const onProgress = (text) => {
      writes = writes.then(() => Task.updateOne({ _id: task._id }, { progress: text })).catch(() => {});
    };

    const res = await runClaude(cfg.claudeBin, args, {
      cwd: wt,
      env,
      taskId: task._id,
      timeoutMs: cfg.timeoutMin * 60 * 1000,
      onProgress,
    });
    await writes;

    const data = findResult(res.stdout);
    if (data?.session_id) task.sessionId = data.session_id;
    // Вопрос, который Claude сохранил через API во время работы
    const fresh = await Task.findById(task._id).select('pendingQuestion').lean();

    outcome = await resolveOutcome({
      res,
      data,
      question: fresh?.pendingQuestion || '',
      cfg,
      wt,
      startPoint,
      branch,
      base,
      direct,
      log: `${res.stdout}\n${res.stderr}`.slice(-20000),
      costUsd: data?.total_cost_usd,
    });
  } catch (err) {
    outcome = {
      status: 'failed',
      summary: `Ошибка воркера: ${err.message}${gitAccessHint(err.message)}`.slice(0, 2000),
      log: err.stack,
    };
  }

  task.status = outcome.status;
  // Результат в основной ветке: показываем её, а diff строим по коммитам запуска
  task.branch = outcome.branch ?? branch;
  task.diffRange = outcome.diffRange ?? { from: '', to: '' };
  task.progress = '';
  if (outcome.status !== 'waiting') task.pendingQuestion = '';
  task.runs.push({
    startedAt,
    finishedAt: new Date(),
    summary: outcome.summary,
    costUsd: outcome.costUsd,
    log: outcome.log,
  });
  const checksText = outcome.checks?.length ? formatChecks(outcome.checks) : '';
  if (checksText) task.comments.push({ author: 'system', text: `Автопроверка: ${checksText}` });
  await task.save();

  await git(repo, ['worktree', 'remove', '--force', wt]).catch(() => {});
  await notifyRunFinished(task, outcome, checksText);
}
