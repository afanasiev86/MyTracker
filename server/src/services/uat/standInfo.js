import { getConfig } from '../../config.js';
import { findStandProject } from '../store/projects.js';
import { standHost } from './standHost.js';

// Состояние стенда проекта для карточки задачи. null, если у проекта стенда нет:
// UAT выключен, проект пушит сразу в ПРОД или стенд ещё ни разу не запускался.
export async function standInfo(slug) {
  const { domain } = getConfig().uat;
  if (!domain) return null;
  const project = await findStandProject(slug);
  if (!project || project.commitToBase || !project.uatStatus || project.uatStatus === 'none') return null;
  return {
    url: `https://${standHost(slug, domain)}`,
    status: project.uatStatus,
    commit: project.uatCommit,
    builtAt: project.uatBuiltAt,
    error: project.uatError,
  };
}
