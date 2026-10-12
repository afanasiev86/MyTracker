// Тело запроса POST /tasks: пробелы убраны, критерии приёмки — списком по строкам
export function buildTaskBody(form) {
  return {
    project: form.project,
    title: form.title.trim(),
    goal: form.goal.trim(),
    acceptance: form.acceptance.split('\n').map((s) => s.trim()).filter(Boolean),
    outOfScope: form.outOfScope.trim(),
    context: form.context.trim(),
    priority: form.priority,
    kind: form.kind || 'other',
    dueDate: form.dueDate || null,
  };
}
