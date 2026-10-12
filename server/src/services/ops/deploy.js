import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getConfig } from '../../config.js';
import { domainError } from '../errors.js';
import { notify } from '../notify/owner.js';
import { run } from './exec.js';
import { assertOpsAvailable } from './platform.js';
import { opsFile } from './notice.js';

const WATCH_EVERY_MS = 5000;
const WATCH_FOR_MS = 20 * 60 * 1000;

async function readJson(name) {
  try {
    return JSON.parse(await fs.readFile(opsFile(name), 'utf8'));
  } catch {
    return null;
  }
}

// Идёт ли обновление: скрипт держит lock-файл с номером своего процесса
async function isRunning() {
  try {
    const pid = Number((await fs.readFile(opsFile('deploy.lock'), 'utf8')).trim());
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// Версия на сервере, идёт ли обновление и чем закончилось прошлое
export async function deployInfo() {
  const appDir = getConfig().ops.appDir;
  const git = await run('git', ['-C', appDir, 'rev-parse', '--short', 'HEAD']);
  const last = await readJson('deploy-result.json');
  return {
    commit: git.ok ? git.stdout.trim() : null,
    running: await isRunning(),
    last: last && { ok: last.ok, message: last.message, from: last.from, to: last.to, finishedAt: last.finishedAt },
  };
}

// Сообщает владельцу итог обновления один раз. true — итог был и отправлен.
export async function reportDeployResult() {
  const result = await readJson('deploy-result.json');
  if (!result || result.reported) return false;
  await fs.writeFile(opsFile('deploy-result.json'), JSON.stringify({ ...result, reported: true }));
  await notify(result.message);
  return true;
}

// Ждёт итога обновления и сообщает его. Сервер при обновлении перезапускается, тогда то же делает reportDeployResult при старте.
export function watchDeployResult() {
  const startedAt = Date.now();
  const timer = setInterval(async () => {
    if (await reportDeployResult().catch(() => false) || Date.now() - startedAt > WATCH_FOR_MS) clearInterval(timer);
  }, WATCH_EVERY_MS);
  timer.unref();
}

// При старте сервера: сообщает итог, который успел записаться, и ждёт тот, что ещё впереди
export async function resumeDeployReporting() {
  await reportDeployResult().catch(() => false);
  if (await isRunning()) watchDeployResult();
}

// Запускает deploy/update.sh вне процесса API (systemd-run): перезапуск API его не прервёт.
// Команда разрешена в sudoers точно в таком виде, см. deploy/ops-setup.sh.
export async function startDeploy() {
  assertOpsAvailable();
  if (await isRunning()) throw domainError('conflict', 'Обновление уже идёт');

  const script = path.join(getConfig().ops.appDir, 'deploy', 'update.sh');
  const res = await run('sudo', [
    '-n', '/usr/bin/systemd-run', '--unit=mytracker-deploy', `--uid=${os.userInfo().username}`, '--collect',
    '/usr/bin/bash', script,
  ]);
  if (!res.ok) {
    const text = (res.stderr || res.error).trim().split('\n')[0];
    const hint = /password is required|not in the sudoers/i.test(text)
      ? 'нет прав на sudo: выполните на сервере deploy/ops-setup.sh'
      : text;
    throw domainError('unavailable', `Не удалось запустить обновление: ${hint}`);
  }
  watchDeployResult();
}
