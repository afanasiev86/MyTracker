import { domainError } from '../errors.js';
import { run } from './exec.js';
import { assertOpsAvailable } from './platform.js';

const F2B_RESET = '/usr/local/sbin/f2b-reset';
const NO_RIGHTS = /password is required|not in the sudoers|may not run sudo|command not found|No such file/i;

// Снимает все блокировки fail2ban. Скрипт и право sudo ставит deploy/ops-setup.sh. Возвращает число снятых адресов.
export async function unbanSsh() {
  assertOpsAvailable();
  const res = await run('sudo', ['-n', F2B_RESET], { timeoutMs: 30000 });
  if (!res.ok) {
    const text = (res.stderr || res.stdout || res.error).trim().split('\n')[0];
    if (NO_RIGHTS.test(text)) throw domainError('unavailable', 'нет прав или скрипта: выполните на сервере deploy/ops-setup.sh');
    throw domainError('unavailable', text || 'команда завершилась с ошибкой');
  }
  return Number(res.stdout.trim().split('\n')[0]) || 0;
}
