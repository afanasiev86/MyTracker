import { useState } from 'react';
import { approveAccessRequest, rejectAccessRequest } from '../../api.js';

// Один запрос: выбор клиента, подтверждение или отклонение
export default function AccessRow({ request, clients, onAct }) {
  const [clientId, setClientId] = useState('');
  const who = `${request.name}${request.username ? ` ${request.username}` : ''}`;

  return (
    <div className="access-row">
      <div>
        <strong>{who}</strong>
        <span className="muted"> · запрос {new Date(request.createdAt).toLocaleString('ru-RU')}</span>
      </div>
      <div className="actions">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} aria-label="Клиент">
          <option value="">Выберите клиента</option>
          {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <button
          disabled={!clientId}
          onClick={() => onAct(() => approveAccessRequest(request._id, clientId))}
        >
          Подтвердить
        </button>
        <button className="ghost" onClick={() => onAct(() => rejectAccessRequest(request._id))}>
          Отклонить
        </button>
      </div>
    </div>
  );
}
