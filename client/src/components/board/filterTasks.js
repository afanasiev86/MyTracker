// Список проектов для фильтра, по алфавиту
export function projectsOf(tasks) {
  return [...new Set(tasks.map((t) => t.project))].sort();
}

// Задачи, видимые на доске: по проекту и по названию (без учёта регистра)
export function filterTasks(tasks, { project, search }) {
  const query = search.trim().toLowerCase();
  return tasks
    .filter((t) => !project || t.project === project)
    .filter((t) => !query || t.title.toLowerCase().includes(query));
}

export function totalCostOf(costs) {
  return costs.reduce((sum, c) => sum + c.costUsd, 0);
}
