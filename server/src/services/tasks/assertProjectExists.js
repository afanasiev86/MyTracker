import { projectExists } from '../store/projects.js';
import { domainError } from '../errors.js';

// Задача может попасть только в существующий проект из CRM
export async function assertProjectExists(slug) {
  if (!(await projectExists(slug))) {
    throw domainError('invalid', `Проект «${slug}» не найден. Сначала создайте его в CRM.`);
  }
}
