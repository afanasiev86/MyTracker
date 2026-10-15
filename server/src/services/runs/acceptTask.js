import path from 'node:path';
import { getConfig } from '../../config.js';
import { baseBranch } from '../projects/baseBranch.js';
import { promoteToBase } from '../../worker/promote.js';
import { gitAccessHint } from '../../worker/env.js';

// Приём результата проверки (кнопка «Принять» в Telegram и в интерфейсе).
// Если результат лежит в UAT, коммиты задачи переносятся в основную ветку. При конфликте задача остаётся на проверке.
export async function acceptTask(task) {
  if (task.status !== 'review') {
    return { error: 'Принять можно только задачу на проверке' };
  }
  const base = await baseBranch(task.project);
  if (task.branch !== base) {
    if (!task.commits?.length) {
      return { error: `У задачи нет сохранённых коммитов, перенести её в «${base}» нельзя` };
    }
    const repo = path.join(getConfig().worker.reposDir, task.project);
    const res = await promoteToBase(repo, { base, commits: task.commits }).catch((err) => ({ ok: false, reason: 'push', error: err.message }));
    if (!res.ok) {
      const why = res.reason === 'conflict' ? 'конфликт с основной веткой' : 'отправка отклонена';
      return { error: `Не удалось влить изменения в «${base}» (${why}): ${res.error}.${gitAccessHint(res.error)}` };
    }
    task.branch = base;
  }
  task.status = 'done';
  await task.save();
  return { task };
}
