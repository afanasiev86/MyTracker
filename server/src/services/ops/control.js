import { domainError } from '../errors.js';
import { findService } from './catalog.js';
import { run } from './exec.js';
import { assertOpsAvailable } from './platform.js';
import { composeArgs, serviceStatus } from './services.js';
import { writeNotice } from './notice.js';

const SYSTEMCTL = '/usr/bin/systemctl';
const RESTART_DELAY_MS = 1000;

// Сервисы, которые владелец остановил сам: монитор не считает их поломкой
export const stoppedOnPurpose = new Set();

// Первая строка ошибки, чтобы показать причину владельцу
function explain(res) {
  const text = (res.stderr || res.error).trim().split('\n')[0];
  if (/password is required|not in the sudoers|may not run sudo/i.test(text)) {
    return 'нет прав на sudo: выполните на сервере deploy/ops-setup.sh';
  }
  return text || 'команда завершилась с ошибкой';
}

// Выполняет действие над сервисом из списка. Сервис и действие проверяются по каталогу.
export async function controlService(id, action) {
  const svc = findService(id);
  if (!svc) throw domainError('not_found', 'Неизвестный сервис');
  if (!svc.actions.includes(action)) throw domainError('invalid', `Для «${svc.label}» действие недоступно`);
  assertOpsAvailable();

  // Сам API перезапускается чуть позже ответа, иначе запрос оборвётся. О результате сообщит запуск после рестарта.
  if (svc.self) {
    await writeNotice('API трекера перезапущен.');
    setTimeout(() => run('sudo', ['-n', SYSTEMCTL, 'restart', svc.unit]), RESTART_DELAY_MS).unref();
    return { scheduled: true, status: 'activating' };
  }

  const res = svc.kind === 'systemd'
    ? await run('sudo', ['-n', SYSTEMCTL, action, svc.unit], { timeoutMs: 60000 })
    : await run('docker', composeArgs(action, svc.service), { timeoutMs: 120000 });
  if (!res.ok) throw domainError('unavailable', `Не удалось выполнить: ${explain(res)}`);
  if (action === 'stop') stoppedOnPurpose.add(id);
  else stoppedOnPurpose.delete(id);
  return { scheduled: false, status: await serviceStatus(svc) };
}
