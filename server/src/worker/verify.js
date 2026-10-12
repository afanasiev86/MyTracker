import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';

// Автопроверка перед статусом «На проверке». Запускаем только те скрипты,
// которые объявлены в package.json проекта: test и lint. Статус от результата не меняется.
const CHECK_NAMES = ['test', 'lint'];
const CHECK_TIMEOUT_MS = 10 * 60 * 1000;
const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const OUTPUT_TAIL = 1500;

function runCommand(cmd, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, env: process.env }, (err, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`;
      resolve({ code: err ? (typeof err.code === 'number' ? err.code : 1) : 0, output });
    });
  });
}

// Какие проверки есть в проекте
export async function projectChecks(wt) {
  let pkg;
  try {
    pkg = JSON.parse(await fs.readFile(path.join(wt, 'package.json'), 'utf8'));
  } catch {
    return [];
  }
  const scripts = pkg.scripts || {};
  return CHECK_NAMES.filter((name) => scripts[name]);
}

// В свежей рабочей копии нет node_modules: ставим зависимости один раз
async function ensureDependencies(wt) {
  try {
    await fs.access(path.join(wt, 'node_modules'));
    return;
  } catch {
    // нет node_modules — ставим ниже
  }
  const hasLock = await fs.access(path.join(wt, 'package-lock.json')).then(() => true, () => false);
  const args = hasLock ? ['ci', '--no-audit', '--no-fund'] : ['install', '--no-audit', '--no-fund'];
  const { code, output } = await runCommand('npm', args, wt, INSTALL_TIMEOUT_MS);
  if (code !== 0) throw new Error(`не удалось установить зависимости: ${output.slice(-500)}`);
}

// Запускает проверки проекта в рабочей копии. Возвращает результат каждой.
// Если проверок нет, возвращает пустой список.
export async function runChecks(wt) {
  const names = await projectChecks(wt);
  if (names.length === 0) return [];
  try {
    await ensureDependencies(wt);
  } catch (err) {
    return [{ name: 'подготовка', ok: false, tail: err.message }];
  }
  const results = [];
  for (const name of names) {
    const { code, output } = await runCommand('npm', ['run', name], wt, CHECK_TIMEOUT_MS);
    results.push({ name, ok: code === 0, code, tail: output.slice(-OUTPUT_TAIL) });
  }
  return results;
}

// Короткая строка для комментария и уведомления: «npm run test — пройдено; npm run lint — не пройдено»
export function formatChecks(results) {
  return results
    .map((r) => (r.name === 'подготовка' ? `автопроверка не запущена: ${r.tail.slice(0, 200)}` : `npm run ${r.name} — ${r.ok ? 'пройдено' : `не пройдено (код ${r.code ?? '?'})`}`))
    .join('; ');
}
