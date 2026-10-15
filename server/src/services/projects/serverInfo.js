import { getConfig } from '../../config.js';
import { standRuntime } from '../uat/standRuntime.js';
import { standHost } from '../uat/standHost.js';
import { localCopy } from './localCopy.js';

// Что у проекта на сервере: локальная копия и UAT-стенд (статус последней сборки и то, что реально запущено).
// stand.enabled false: стенда у проекта нет (UAT выключен или проект пушит сразу в ПРОД).
export async function projectServerInfo(project) {
  const { domain } = getConfig().uat;
  const enabled = Boolean(domain) && !project.commitToBase;
  const [copy, runtime] = await Promise.all([localCopy(project.slug), enabled ? standRuntime(project.slug) : null]);
  return {
    localCopy: copy,
    stand: {
      enabled,
      status: project.uatStatus || 'none',
      url: enabled ? `https://${standHost(project.slug, domain)}` : '',
      commit: project.uatCommit || '',
      builtAt: project.uatBuiltAt || null,
      error: project.uatError || '',
      runtime,
    },
  };
}
