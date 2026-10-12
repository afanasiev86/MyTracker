import Project from '../../models/Project.js';

// Даты из JSON приходят строками: переводим в Date, пустую дату — в null
export function normalize(data) {
  const out = { ...data };
  if (out.dueDate !== undefined) out.dueDate = out.dueDate ? new Date(out.dueDate) : null;
  return out;
}

// Задача может попасть только в существующий проект из CRM
export async function assertProjectExists(slug) {
  if (!(await Project.exists({ slug }))) {
    const error = new Error(`Проект «${slug}» не найден. Сначала создайте его в CRM.`);
    error.status = 400;
    throw error;
  }
}

// Экранирует спецсимволы, чтобы поиск по названию был обычным текстом
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
