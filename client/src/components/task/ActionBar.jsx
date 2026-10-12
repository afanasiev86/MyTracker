import { STATUS_LABELS, RUNNABLE_FROM, allowedTargets } from '../../../../shared/statuses.js';

// Подписи действий описывают, что произойдёт, а не новый статус
const ACTION_LABELS = {
  ready: 'Отдать в работу',
  backlog: 'Вернуть в бэклог',
  done: 'Принять результат',
};

// Кнопки действий над задачей: отмена, запуск, переходы статуса, diff
export default function ActionBar({ task, busy, diffShown, onCancel, onRun, onTransition, onToggleDiff }) {
  const targets = allowedTargets(task.status);
  const canRun = RUNNABLE_FROM.includes(task.status);
  const runLabel = task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude';
  return (
    <div className="actions">
      {task.status === 'in_progress' && (
        <button className="danger" disabled={busy} onClick={onCancel}>
          Отменить запуск
        </button>
      )}
      {canRun && (
        <button disabled={busy} onClick={onRun}>
          {runLabel}
        </button>
      )}
      {targets.map((status) => (
        <button key={status} className="ghost" disabled={busy} onClick={() => onTransition(status)}>
          {ACTION_LABELS[status] || STATUS_LABELS[status]}
        </button>
      ))}
      {task.branch && (
        <button className="ghost" onClick={onToggleDiff}>
          {diffShown ? 'Скрыть diff' : 'Показать diff'}
        </button>
      )}
    </div>
  );
}
