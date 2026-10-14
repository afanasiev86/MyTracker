import Project from '../../models/Project.js';
import { getConfig } from '../../config.js';

// Основная ветка проекта (поле «Основная ветка»); если не задана, общая DEFAULT_BRANCH
export async function baseBranch(slug) {
  const project = await Project.findOne({ slug }).select('defaultBranch').lean();
  return project?.defaultBranch || getConfig().worker.defaultBranch;
}
