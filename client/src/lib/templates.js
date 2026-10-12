// Шаблоны задач: заготовки текста для частых типов работ. Заполняют только пустые поля.

export const TASK_TEMPLATES = {
  bug: {
    label: 'Баг',
    goal: 'Исправить ошибку: ожидаемое поведение должно совпадать с фактическим.',
    acceptance: [
      'Ошибка больше не воспроизводится по шагам из контекста',
      'Добавлен тест, который падал бы до исправления',
      'Соседние сценарии работают как раньше',
    ],
    outOfScope: 'Не менять внешний вид и не рефакторить соседний код.',
    context: 'Шаги воспроизведения:\nОжидаемо:\nФактически:',
  },
  feature: {
    label: 'Фича',
    goal: 'Добавить возможность: что получит пользователь.',
    acceptance: [
      'Сценарий работает от начала до конца',
      'Есть тесты для новой логики',
      'Ошибки и пустые состояния обработаны',
    ],
    outOfScope: '',
    context: 'Макеты или ссылки:',
  },
  refactor: {
    label: 'Рефакторинг',
    goal: 'Упростить код без изменения поведения.',
    acceptance: [
      'Поведение не изменилось: существующие тесты проходят',
      'Lint и сборка проходят',
    ],
    outOfScope: 'Не добавлять новую функциональность.',
    context: '',
  },
};

// Возвращает поля формы с подставленным шаблоном; уже заполненные поля не трогает
export function applyTemplate(form, key) {
  const template = TASK_TEMPLATES[key];
  if (!template) return form;
  return {
    ...form,
    goal: form.goal || template.goal,
    acceptance: form.acceptance || template.acceptance.join('\n'),
    outOfScope: form.outOfScope || template.outOfScope,
    context: form.context || template.context,
  };
}
