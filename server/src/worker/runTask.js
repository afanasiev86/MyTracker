import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import Task from '../models/Task.js';
import { issueToken } from '../services/auth.js';
import { notify } from '../services/notify.js';
import { STATUS_LABELS } from '../../../shared/statuses.js';
import { git } from './git.js';
import { isLimitError } from './limits.js';
import { registerRun, unregisterRun, stopRun } from './processes.js';
import { progressFromEvent, parseStreamLine, findResult, LineSplitter } from './progress.js';

// Скрипт для вызовов API трекера (deploy/tracker-api.sh рядом с сервером)
const TRACKER_CLI = fileURLToPath(new URL('../../../deploy/tracker-api.sh', import.meta.url));

// Инструменты, которые Claude может использовать без подтверждения.
// Нет curl и npx: сеть доступна только через скрипт трекера и npm для нужных команд.
function claudeTools() {
  return [
    'Read', 'Edit', 'Write',
    'Bash(git *)',
    'Bash(npm test*)', 'Bash(npm run lint*)', 'Bash(npm run build*)',
    'Bash(npm ci*)', 'Bash(npm install*)',
    `Bash(${TRACKER_CLI} *)`,
  ].join(' ');
}

const ICONS = { review: '🔍', failed: '❌', ready: '⏸', waiting: '❓' };

function config() {
  return {
    reposDir: process.env.REPOS_DIR,
    worktreesDir: process.env.WORKTREES_DIR,
    base: process.env.DEFAULT_BRANCH || 'main',
    claudeBin: process.env.CLAUDE_BIN || 'claude',
    apiUrl: process.env.TRACKER_API_URL || `http://localhost:${process.env.PORT || 3001}/api`,
    timeoutMin: Number(process.env.RUN_TIMEOUT_MIN) || 30,
  };
}

// Не чаще раза в PROGRESS_THROTTLE_MS пишем прогресс в базу
const PROGRESS_THROTTLE_MS = 3000;

function runClaude(bin, args, { cwd, env, taskId, timeoutMs, onProgress }) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { cwd, env });
    registerRun(taskId, child);
    const timer = setTimeout(() => stopRun(taskId, 'timeout'), timeoutMs);

    let stdout = '';
    let stderr = '';
    const splitter = new LineSplitter();
    let lastSent = 0;
    let pending = null;

    const handleLines = (lines) => {
      for (const line of lines) {
        const text = progressFromEvent(parseStreamLine(line));
        if (!text || !onProgress) continue;
        pending = text;
        const now = Date.now();
        if (now - lastSent >= PROGRESS_THROTTLE_MS) {
          lastSent = now;
          pending = null;
          onProgress(text);
        }
      }
    };

    child.stdout.on('data', (d) => {
      stdout += d;
      handleLines(splitter.push(String(d)));
    });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (err) => {
      clearTimeout(timer);
      unregisterRun(taskId);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      handleLines(splitter.flush());
      // Последнее сообщение могло прийти внутри окна троттлинга
      if (pending && onProgress) onProgress(pending);
      const entry = unregisterRun(taskId);
      resolve({ code, stdout, stderr, reason: entry?.reason ?? null });
    });
  });
}

// Готовит отдельную рабочую копию под задачу.
// Если ветка уже есть в origin (продолжение после вопроса или доработка), продолжаем с неё.
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

async function countNewCommits(wt, startPoint) {
  return Number((await git(wt, ['rev-list', '--count', `${startPoint}..HEAD`])).trim());
}

// options.answer — ответ владельца на вопрос Claude. Продолжаем ту же сессию.
export async function runTask(taskId, { answer = null } = {}) {
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
      TRACKER_TOKEN: await issueToken('worker', '2h'),
      TRACKER_CLI,
    };

    let args;
    if (answer && task.sessionId) {
      args = ['-p', answer, '--resume', task.sessionId, '--output-format', 'stream-json', '--verbose', '--allowedTools', claudeTools()];
    } else if (answer) {
      // Сессии нет (например, она потеряна): передаём ответ вместе с задачей
      args = ['-p', `/implement-task ${task._id}\n\nОтвет владельца на ваш вопрос: ${answer}`,
        '--output-format', 'stream-json', '--verbose', '--allowedTools', claudeTools()];
    } else {
      args = ['-p', `/implement-task ${task._id}`, '--output-format', 'stream-json', '--verbose', '--allowedTools', claudeTools()];
    }

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
    const log = `${res.stdout}\n${res.stderr}`.slice(-20000);
    const costUsd = data?.total_cost_usd;
    if (data?.session_id) task.sessionId = data.session_id;

    // Вопрос, который Claude сохранил через API во время работы
    const fresh = await Task.findById(task._id).select('pendingQuestion').lean();
    const question = fresh?.pendingQuestion || '';

    if (res.reason === 'cancelled') {
      outcome = { status: 'failed', summary: 'Запуск остановлен вручную.', costUsd, log };
    } else if (res.reason === 'timeout') {
      outcome = {
        status: 'failed',
        summary: `Превышено время запуска (${cfg.timeoutMin} мин). Запуск остановлен.`,
        costUsd,
        log,
      };
    } else if (isLimitError(res.stdout) || isLimitError(res.stderr)) {
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
    } else if (question) {
      // Claude ждёт ответа. Сохраняем сделанное, чтобы продолжить с того же места
      if (await countNewCommits(wt, startPoint) > 0) {
        await git(wt, ['push', '-u', 'origin', branch]);
      }
      outcome = { status: 'waiting', summary: question, costUsd, log };
    } else {
      const newCommits = await countNewCommits(wt, startPoint);
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
  task.progress = '';
  if (outcome.status !== 'waiting') task.pendingQuestion = '';
  task.runs.push({
    startedAt,
    finishedAt: new Date(),
    summary: outcome.summary,
    costUsd: outcome.costUsd,
    log: outcome.log,
  });
  await task.save();

  await git(repo, ['worktree', 'remove', '--force', wt]).catch(() => {});

  const title = outcome.status === 'waiting'
    ? `${task.project}: ${task.title}\nClaude ждёт ответа:\n${outcome.summary}\n\n` +
      `Ответьте ответом на это сообщение или командой /answer ${task._id} текст`
    : `${task.project}: ${task.title}\nСтатус: ${STATUS_LABELS[task.status]}\n${outcome.summary.slice(0, 800)}`;
  await notify(`${ICONS[task.status] ?? 'ℹ️'} ${title}\nID: ${task._id}`);
}
