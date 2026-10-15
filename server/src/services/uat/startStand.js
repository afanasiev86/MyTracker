import { getConfig } from '../../config.js';
import { domainError } from '../errors.js';
import { opsAvailable } from '../ops/platform.js';
import { findStandProject, saveStandState } from '../store/projects.js';
import { requestDeploy } from './requestDeploy.js';

// Запуск стенда по кнопке в карточке проекта: нужен, когда стенд ещё ни разу не собирался и задач, после которых
// он собирается сам, пока не было. Сборка идёт в фоне; статус «собирается» ставится сразу, чтобы карточка его показала.
// Ошибки — DomainError.
export async function startStand(slug) {
  const project = await findStandProject(slug);
  if (!project) throw domainError('not_found', 'Проект не найден');
  if (!getConfig().uat.domain) throw domainError('unavailable', 'UAT-стенды выключены: не задан UAT_DOMAIN');
  if (!opsAvailable()) throw domainError('unavailable', 'Стенд собирается только на Linux-сервере с docker');
  if (project.commitToBase) throw domainError('conflict', 'Проект пушит сразу в ПРОД: стенда у него нет');
  if (!project.repoUrl) throw domainError('conflict', 'У проекта не указан репозиторий');
  await saveStandState(slug, { uatStatus: 'building', uatError: '' });
  requestDeploy(slug);
}
