import Project from '../../models/Project.js';
import { taskExistsInProject } from './tasks.js';

// Доступ к проектам в базе
export function findProject(id) {
  return Project.findById(id);
}

export function findProjectWithClient(id) {
  return Project.findById(id).populate('client', 'name').lean();
}

export function listProjectsWithClient() {
  return Project.find().sort({ name: 1 }).populate('client', 'name').lean();
}

export function listProjectBriefs() {
  return Project.find().select('slug name status client').lean();
}

export function createProject(data) {
  return Project.create(data);
}

export function projectExists(slug) {
  return Project.exists({ slug });
}

export function projectsOfClientExist(clientId) {
  return Project.exists({ client: clientId });
}

// Изменение проекта. Slug нельзя менять, если по нему уже есть задачи: они привязаны к нему.
export async function updateProject(id, patch) {
  const current = await Project.findById(id);
  if (!current) return { notFound: true };
  if (patch.slug && patch.slug !== current.slug && await taskExistsInProject(current.slug)) {
    return { conflict: 'Нельзя переименовать slug: в проекте есть задачи' };
  }
  Object.assign(current, patch);
  await current.save();
  return { project: current.toObject() };
}

// Удаление только пустого проекта
export async function deleteProject(id) {
  const project = await Project.findById(id);
  if (!project) return { notFound: true };
  if (await taskExistsInProject(project.slug)) {
    return { conflict: 'В проекте есть задачи, удалить нельзя' };
  }
  await project.deleteOne();
  return { ok: true };
}
