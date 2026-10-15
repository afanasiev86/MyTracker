import Project from '../../models/Project.js';
import { getConfig } from '../../config.js';

// Ветки проекта и режим сохранения результата.
// base: основная ветка (поле «Основная ветка»), если не задана, общая DEFAULT_BRANCH.
// direct: коммитить сразу в основную ветку («в ПРОД»). uat: ветка проверки, куда идёт результат, если direct выключен.
export async function branchSettings(slug) {
  const project = await Project.findOne({ slug }).select('defaultBranch commitToBase uatBranch').lean();
  return {
    base: project?.defaultBranch || getConfig().worker.defaultBranch,
    direct: Boolean(project?.commitToBase),
    uat: project?.uatBranch || 'uat',
  };
}

export async function baseBranch(slug) {
  return (await branchSettings(slug)).base;
}
