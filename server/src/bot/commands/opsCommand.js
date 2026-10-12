import { SERVICES, findService } from '../../services/ops/catalog.js';
import { opsAvailable } from '../../services/ops/platform.js';
import { getOpsStatus } from '../../services/ops/status.js';
import { formatStatus } from '../../services/ops/format.js';
import { readLogs, DEFAULT_LINES } from '../../services/ops/logs.js';
import { confirmKeyboard } from '../opsCallbackData.js';

const TELEGRAM_LIMIT = 3800;
const VERBS = { restart: 'Перезапустить', start: 'Запустить', stop: 'Остановить' };

const ids = () => SERVICES.map((s) => s.id).join(', ');

// /server: ресурсы и состояние сервисов
export async function serverCommand() {
  return formatStatus(await getOpsStatus());
}

// /logs <сервис> [строк]: хвост журнала, обрезанный под лимит сообщения Telegram
export async function logsCommand(args) {
  const [id, lines] = args;
  if (!id || !findService(id)) return `Укажите сервис: /logs <сервис> [строк]. Доступны: ${ids()}`;
  const text = await readLogs(id, lines ?? DEFAULT_LINES);
  if (!text) return `В журнале «${id}» пока пусто.`;
  return text.length > TELEGRAM_LIMIT ? `…${text.slice(-TELEGRAM_LIMIT)}` : text;
}

// /service <restart|start|stop> <сервис>: сначала спрашиваем подтверждение кнопкой
export function serviceCommand(args) {
  const [action, id] = args;
  const svc = findService(id);
  if (!VERBS[action] || !svc) {
    return `Использование: /service <restart|start|stop> <сервис>. Доступны: ${ids()}`;
  }
  if (!svc.actions.includes(action)) return `Для «${svc.label}» действие недоступно.`;
  if (!opsAvailable()) return 'Управление сервисами доступно только на Linux-сервере.';
  return { text: `${VERBS[action]} «${svc.label}»?`, reply_markup: confirmKeyboard(action, id) };
}

// /deploy: обновление MyTracker, с подтверждением
export function deployCommand() {
  if (!opsAvailable()) return 'Обновление доступно только на Linux-сервере.';
  return {
    text: 'Обновить MyTracker до последней версии из GitHub? API будет перезапущен. Если новая версия не запустится, вернётся прежняя.',
    reply_markup: confirmKeyboard('deploy'),
  };
}
