import { projectExists } from '../store/projects.js';

// Задача может попасть только в существующий проект из CRM
export async function assertProjectExists(slug) {
  if (!(await projectExists(slug))) {
    const error = new Error(`Проект «${slug}» не найден. Сначала создайте его в CRM.`);
    error.status = 400;
    throw error;
  }
}
