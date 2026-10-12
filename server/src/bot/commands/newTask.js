import Task from '../../models/Task.js';
import Project from '../../models/Project.js';

// /new <проект> <заголовок>: создать задачу из чата
export async function newTaskCommand(args) {
  const [project, ...words] = args;
  const title = words.join(' ');
  if (!project || !title) return 'Формат: /new <проект> <заголовок>';
  if (!(await Project.exists({ slug: project }))) {
    return `Проект «${project}» не найден. Создайте его в CRM или проверьте slug.`;
  }
  const task = await Task.create({ project, title });
  return `Создана задача ${task._id}\n${project}: ${title}`;
}
