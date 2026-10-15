import { getConfig } from '../../config.js';
import { notify } from '../notify/owner.js';
import { opsAvailable } from '../ops/platform.js';
import { failInterruptedStands, saveStandState } from '../store/projects.js';
import { deployStand } from './deployStand.js';

// Сборки идут по одной: каждая стенд ставит зависимости и образы, и память сервера общая.
// Проект, запрошенный повторно, пока ждёт или собирается, собирается ещё раз после текущей: в ветке UAT уже новые коммиты.
const queue = [];
let running = false;

async function buildOne(slug) {
  await saveStandState(slug, { uatStatus: 'building', uatError: '' });
  try {
    const { host, commit } = await deployStand(slug);
    await saveStandState(slug, { uatStatus: 'ready', uatCommit: commit, uatBuiltAt: new Date(), uatError: '' });
    await notify(`🧪 Стенд https://${host} обновлён (коммит ${commit})`);
  } catch (err) {
    const error = String(err.message).slice(0, 2000);
    await saveStandState(slug, { uatStatus: 'failed', uatError: error });
    await notify(`⚠️ Стенд проекта ${slug} не собрался: ${error.slice(0, 800)}`);
  }
}

async function pump() {
  if (running) return;
  running = true;
  try {
    while (queue.length > 0) await buildOne(queue.shift());
  } finally {
    running = false;
  }
}

// Ставит сборку стенда проекта в очередь. Без UAT_DOMAIN (и не на Linux-сервере) стенды выключены: ничего не делает.
// Возвращает true, если сборка поставлена.
export function requestDeploy(slug) {
  if (!getConfig().uat.domain || !opsAvailable()) return false;
  if (!queue.includes(slug)) queue.push(slug);
  void pump();
  return true;
}

// После перезапуска сервера сборка, которая шла, уже не существует
export const failInterruptedDeploys = () => failInterruptedStands('Сборка прервана перезапуском сервера. Будет пересобрана после следующей задачи.');
