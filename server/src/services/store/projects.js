import Project from '../../models/Project.js';
import { taskExistsInProject } from './tasks.js';
import { domainError } from '../errors.js';

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
// Ошибки — DomainError (404, 409).
export async function updateProject(id, patch) {
  const current = await Project.findById(id);
  if (!current) throw domainError('not_found', 'Проект не найден');
  if (patch.slug && patch.slug !== current.slug && await taskExistsInProject(current.slug)) {
    throw domainError('conflict', 'Нельзя переименовать slug: в проекте есть задачи');
  }
  Object.assign(current, patch);
  await current.save();
  return current.toObject();
}

// Удаление только пустого проекта. Ошибки — DomainError (404, 409).
export async function deleteProject(id) {
  const project = await Project.findById(id);
  if (!project) throw domainError('not_found', 'Проект не найден');
  if (await taskExistsInProject(project.slug)) {
    throw domainError('conflict', 'В проекте есть задачи, удалить нельзя');
  }
  await project.deleteOne();
}
