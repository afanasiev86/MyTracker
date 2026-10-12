import { controlService } from '../../services/ops/control.js';
import { startDeploy } from '../../services/ops/deploy.js';
import { findService, ACTION_LABELS } from '../../services/ops/catalog.js';
import { decodeOpsCallback } from '../opsCallbackData.js';

// Нажатие «Подтвердить» или «Отмена» под вопросом о действии над сервером
export async function handleOpsCallback(data) {
  const parsed = decodeOpsCallback(data);
  if (!parsed) return 'Эта кнопка устарела.';
  if (parsed.expired) return 'Подтверждение устарело. Отправьте команду заново.';
  if (parsed.action === 'cancel') return 'Отменено.';

  if (parsed.action === 'deploy') {
    await startDeploy();
    return 'Обновление запущено. Напишу, когда закончится.';
  }

  const svc = findService(parsed.target);
  if (!svc) return 'Неизвестный сервис.';
  const result = await controlService(svc.id, parsed.action);
  if (result.scheduled) return `«${svc.label}» перезапускается, это займёт несколько секунд. Напишу, когда вернётся.`;
  return `«${svc.label}» ${ACTION_LABELS[parsed.action]}.`;
}
