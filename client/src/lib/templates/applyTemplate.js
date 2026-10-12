import { TASK_TEMPLATES } from './catalog.js';

// Возвращает поля формы с подставленным шаблоном; уже заполненные поля не трогает
export function applyTemplate(form, key) {
  const template = TASK_TEMPLATES[key];
  if (!template) return form;
  return {
    ...form,
    // Шаблон задаёт и тип задачи: от него зависят инструкции для Claude
    kind: key,
    goal: form.goal || template.goal,
    acceptance: form.acceptance || template.acceptance.join('\n'),
    outOfScope: form.outOfScope || template.outOfScope,
    context: form.context || template.context,
  };
}
