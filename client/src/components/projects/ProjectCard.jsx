import { PROJECT_STATUS_LABELS } from '../../../../shared/crm.js';
import { formatUsd } from '../../lib/cost.js';

// Карточка проекта: название, статус, клиент, срок и затраты
export default function ProjectCard({ project, onOpen }) {
  const p = project;
  return (
    <article
      className="row-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(p)}
    >
      <div>
        <strong>{p.name}</strong> <span className="muted">{p.slug}</span>
      </div>
      <div className="muted">
        {PROJECT_STATUS_LABELS[p.status]}
        {p.client && ` · клиент ${p.client.name}`}
        {p.deadline && ` · срок ${new Date(p.deadline).toLocaleDateString('ru-RU')}`}
      </div>
      <div className="muted">
        Задач: {p.stats.tasks}, открыто {p.stats.open} · затраты на Claude {formatUsd(p.stats.costUsd)}
      </div>
    </article>
  );
}
