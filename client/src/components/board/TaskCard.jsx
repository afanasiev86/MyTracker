import { PRIORITY_LABELS } from '../../../../shared/crm.js';
import { sumRunCosts, formatUsd } from '../../lib/cost.js';

// Карточка задачи на доске
export default function TaskCard({ task, onOpen }) {
  const cost = sumRunCosts(task.runs);
  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task._id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task._id)}
    >
      <strong>
        {task.priority === 'high' && (
          <span className="prio-high" title={PRIORITY_LABELS.high}>Срочно · </span>
        )}
        {task.title}
      </strong>
      <small>
        {task.project}
        {task.dueDate && ` · до ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`}
        {cost > 0 && <span className="cost-badge"> · {formatUsd(cost)}</span>}
      </small>
    </article>
  );
}
