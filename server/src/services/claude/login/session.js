import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { workerConfig } from '../../../worker/config.js';
import { childEnv } from '../../../worker/env.js';
import { domainError } from '../../errors.js';
import { findLoginError, findLoginUrl, findToken } from './terminal.js';

// Вход в подписку Claude без доступа к серверу: воркер запускает `claude setup-token` в псевдотерминале
// (утилита script из util-linux, новых пакетов не нужно), отдаёт владельцу ссылку, принимает код со страницы
// входа и забирает выданный токен. Одновременно идёт один вход, он сам закрывается через LOGIN_TTL_MS.
const LOGIN_TTL_MS = 10 * 60 * 1000;
const URL_WAIT_MS = 30 * 1000;
const TOKEN_WAIT_MS = 60 * 1000;
// Широкий терминал: ссылка и токен не переносятся по строкам
const SHELL = 'stty cols 500 rows 50 2>/dev/null; exec "$MT_CLAUDE_BIN" setup-token';

let current = null;

// Настройки можно подменить в тестах
export const loginOptions = { ttlMs: LOGIN_TTL_MS, urlWaitMs: URL_WAIT_MS, tokenWaitMs: TOKEN_WAIT_MS, bin: null };

function killTree(child) {
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}

export async function cancelLogin() {
  const login = current;
  current = null;
  if (!login) return;
  clearTimeout(login.timer);
  killTree(login.child);
  await fs.rm(login.dir, { recursive: true, force: true }).catch(() => {});
}

export const hasLogin = () => current !== null;

// Ждёт, пока в выводе появится нужное (check вернёт значение), процесс не завершится или не выйдет время
function waitFor(login, check, ms) {
  return new Promise((resolve) => {
    const finish = (value) => {
      clearInterval(poll);
      clearTimeout(limit);
      login.child.off('close', onClose);
      resolve(value);
    };
    const tick = () => {
      const found = check(login.buf);
      if (found) finish({ found });
    };
    // Процесс мог напечатать токен и сразу завершиться: перед выходом смотрим вывод в последний раз
    const onClose = () => {
      const found = check(login.buf);
      finish(found ? { found } : { closed: true });
    };
    const poll = setInterval(tick, 100);
    const limit = setTimeout(() => finish({ timeout: true }), ms);
    login.child.on('close', onClose);
    tick();
  });
}

// Запускает вход и возвращает ссылку, которую владелец открывает в браузере (на телефоне тоже)
export async function startLogin() {
  await cancelLogin();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mt-claude-login-'));
  const env = { ...childEnv(), TERM: 'xterm-256color', MT_CLAUDE_BIN: loginOptions.bin || workerConfig().claudeBin, CLAUDE_CONFIG_DIR: dir };
  delete env.ANTHROPIC_API_KEY;
  delete env.CLAUDE_CODE_OAUTH_TOKEN;
  delete env.BROWSER;

  const child = spawn('script', ['-qefc', SHELL, '/dev/null'], { env, detached: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const login = { child, dir, buf: '', timer: setTimeout(() => cancelLogin(), loginOptions.ttlMs) };
  const spawnFailed = new Promise((resolve) => child.once('error', resolve));
  child.stdout.on('data', (d) => { login.buf += d; });
  child.stderr.on('data', (d) => { login.buf += d; });
  child.stdin.on('error', () => {});
  current = login;

  const result = await Promise.race([waitFor(login, findLoginUrl, loginOptions.urlWaitMs), spawnFailed.then((err) => ({ err }))]);
  if (result.found) return { url: result.found };

  await cancelLogin();
  if (result.err?.code === 'ENOENT') {
    throw domainError('unavailable', 'На сервере нет утилиты script (пакет util-linux). Установите её или введите токен вручную.');
  }
  throw domainError('unavailable', findLoginError(login.buf) || 'Не удалось получить ссылку для входа. Проверьте, что на сервере установлен claude, и попробуйте ещё раз.');
}

// Принимает код со страницы входа, ждёт токен и возвращает его. После этого вход закрыт.
export async function finishLogin(code) {
  const login = current;
  if (!login) throw domainError('invalid', 'Вход не начат или истёк. Нажмите «Войти через подписку» ещё раз.');
  // TEMP-DIAG: убрать после выяснения причины
  const mask = (s) => JSON.stringify(String(s).replace(/sk-ant-oat\d*-[A-Za-z0-9_-]+/g, 'sk-ant-oat-***').split(code).join('<code>'));
  console.warn(`[login-diag] before code: len=${code.length} buf=${mask(login.buf)}`);
  login.buf = '';
  login.child.stdin.write(`${code}\r`);

  const result = await waitFor(login, (buf) => findToken(buf) || (findLoginError(buf) && 'error'), loginOptions.tokenWaitMs);
  console.warn(`[login-diag] result=${Object.keys(result)} exit=${login.child.exitCode} signal=${login.child.signalCode} buf=${mask(login.buf)}`);
  if (result.found && result.found !== 'error') {
    await cancelLogin();
    return result.found;
  }
  const reason = findLoginError(login.buf);
  await cancelLogin();
  throw domainError('invalid', reason
    ? `Вход не удался: ${reason}. Нажмите «Войти через подписку» и попробуйте ещё раз.`
    : 'Вход не завершился: код не подошёл или истёк. Нажмите «Войти через подписку» и попробуйте ещё раз.');
}
