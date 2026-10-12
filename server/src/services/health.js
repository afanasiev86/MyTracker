import mongoose from 'mongoose';
import { execFile } from 'node:child_process';
import Task from '../models/Task.js';
import { telegramApi, telegramEnabled } from './telegram.js';
import { getActiveProvider, probeProvider } from './storage.js';
import { queueSizes } from '../worker/queue.js';
import { runningTaskIds } from '../worker/processes.js';

// Результаты проверок кэшируются, чтобы частые опросы не нагружали Telegram и хранилище
const CACHE_MS = 30 * 1000;
const TIMEOUT_MS = 5 * 1000;
const STARTED_AT = new Date();
let cache = null;

// Ограничивает время ожидания: зависший сервис не должен зависать и /api/health
export function withTimeout(promise, ms = TIMEOUT_MS) {
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('нет ответа')), ms);
  });
  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));
}

async function mongoCheck() {
  if (mongoose.connection.readyState !== 1) return { ok: false, error: 'нет соединения' };
  try {
    await withTimeout(mongoose.connection.db.admin().ping());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Claude Code доступен, если его бинарник отвечает на --version (запросов к модели не делает)
function claudeCheck() {
  const bin = process.env.CLAUDE_BIN || 'claude';
  return new Promise((resolve) => {
    execFile(bin, ['--version'], { timeout: TIMEOUT_MS }, (err, stdout) => {
      if (err) resolve({ ok: false, error: 'не найден или не отвечает' });
      else resolve({ ok: true, version: stdout.trim() });
    });
  });
}

async function telegramCheck() {
  if (!telegramEnabled()) return { enabled: false, ok: true };
  try {
    await withTimeout(telegramApi('getMe', {}));
    return { enabled: true, ok: true };
  } catch (err) {
    return { enabled: true, ok: false, error: err.message };
  }
}

async function storageCheck() {
  // Без базы не знаем, какой провайдер выбран, и не ждём таймаут Mongoose
  if (mongoose.connection.readyState !== 1) return { ok: false, error: 'база недоступна' };
  const provider = await withTimeout(getActiveProvider());
  const probe = await probeProvider(provider);
  // Не настроенное хранилище не считаем поломкой: вложения просто не используются
  return { provider, ...probe, ok: !probe.configured || probe.reachable };
}

// Все проверки разом. Результат кэшируется на CACHE_MS, если не запрошено свежее.
export async function getChecks({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const [mongo, claude, storage, telegram] = await Promise.all([
    mongoCheck(),
    claudeCheck(),
    storageCheck(),
    telegramCheck(),
  ]);
  const value = {
    ok: mongo.ok && claude.ok && storage.ok && telegram.ok,
    mongo,
    claude,
    storage,
    telegram,
  };
  cache = { at: Date.now(), value };
  return value;
}

// Публичный ответ: только признаки «работает/нет», без адресов, провайдеров и текстов ошибок
export async function getPublicHealth() {
  const { ok, mongo, claude, storage, telegram } = await getChecks();
  return {
    ok,
    checks: { mongo: mongo.ok, claude: claude.ok, storage: storage.ok, telegram: telegram.ok },
  };
}

// Подробности для владельца: воркер (очередь и запуски), сессии Claude, процесс
export async function getDetails() {
  const checks = await getChecks();
  const running = runningTaskIds();
  const [inProgress, waitingForAnswer] = await Promise.all([
    Task.find({ status: 'in_progress' }).select('_id').lean(),
    Task.countDocuments({ status: 'waiting' }),
  ]);
  // Задача «в работе», для которой нет процесса, — сессия потеряна (например, после перезапуска)
  const stale = inProgress.filter((t) => !running.includes(String(t._id))).length;
  return {
    checks,
    process: {
      startedAt: STARTED_AT,
      uptimeSec: Math.round(process.uptime()),
      rssMb: Math.round(process.memoryUsage().rss / 1048576),
    },
    worker: {
      // Сколько заданий стоит или выполняется по каждому проекту
      queues: queueSizes(),
      runningProcesses: running.length,
    },
    sessions: {
      inProgress: inProgress.length,
      waitingForAnswer,
      stale,
    },
  };
}

// Для тестов: сбрасывает кэш проверок
export function resetHealthCache() {
  cache = null;
}
