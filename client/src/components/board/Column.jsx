import { STATUS_LABELS } from '../../../../shared/statuses.js';
import TaskCard from './TaskCard.jsx';

// Колонка статуса со своими карточками
export default function Column({ status, items, onOpen }) {
  return (
    <section className="column">
      <h2>
        {STATUS_LABELS[status]} <span className="count">{items.length}</span>
      </h2>
      {items.map((t) => (
        <TaskCard key={t._id} task={t} onOpen={onOpen} />
      ))}
    </section>
  );
}
