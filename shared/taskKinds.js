// Тип задачи: от него зависит, как Claude к ней подходит (инструкции в skill implement-task)

export const TASK_KINDS = ['bug', 'feature', 'refactor', 'other'];

export const KIND_LABELS = {
  bug: 'Баг',
  feature: 'Фича',
  refactor: 'Рефакторинг',
  other: 'Без типа',
};
