import { formatUsd } from '../../lib/cost.js';
import { formatRate } from './formatRate.js';

// Карточка клиента: ставка, проекты, затраты и состояние портала
export default function ClientCard({ client, onOpen, onClosePortal }) {
  return (
    <article
      className="row-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(client)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(client)}
    >
      <div>
        <strong>{client.name}</strong>
        {client.company && <span className="muted"> · {client.company}</span>}
      </div>
      <div className="muted">
        {formatRate(client.rate)} · проектов: {client.projects.length} · затраты на Claude {formatUsd(client.costUsd)}
      </div>
      {client.projects.length > 0 && (
        <div className="muted">{client.projects.map((p) => p.name).join(', ')}</div>
      )}
      {client.telegramId ? (
        <div className="portal-row">
          <span className="badge">Портал открыт</span>
          <button
            className="ghost"
            onClick={(e) => { e.stopPropagation(); onClosePortal(client); }}
          >
            Закрыть доступ
          </button>
        </div>
      ) : (
        <div className="muted">Портал не подключён: подтвердите запрос выше</div>
      )}
    </article>
  );
}
