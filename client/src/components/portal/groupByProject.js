// Группировка задач по проектам, порядок внутри группы сохраняется (от нового к старому)
export function groupByProject(tasks) {
  const byProject = new Map();
  for (const t of tasks) {
    if (!byProject.has(t.project)) byProject.set(t.project, []);
    byProject.get(t.project).push(t);
  }
  return [...byProject.entries()];
}
