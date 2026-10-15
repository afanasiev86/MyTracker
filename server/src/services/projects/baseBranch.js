import Project from '../../models/Project.js';
import { getConfig } from '../../config.js';

// Основная ветка проекта (поле «Основная ветка») и режим сохранения результата.
// base: если не задана, общая DEFAULT_BRANCH. direct: коммитить сразу в основную ветку, без ветки задачи.
export async function branchSettings(slug) {
  const project = await Project.findOne({ slug }).select('defaultBranch commitToBase').lean();
  return {
    base: project?.defaultBranch || getConfig().worker.defaultBranch,
    direct: Boolean(project?.commitToBase),
  };
}

export async function baseBranch(slug) {
  return (await branchSettings(slug)).base;
}
