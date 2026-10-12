import { useCallback, useEffect, useState } from 'react';
import { fetchClients, deleteClient } from '../api.js';
import { RATE_LABELS } from '../../../shared/crm.js';
import { formatUsd } from '../lib/cost.js';
import ClientForm from './ClientForm.jsx';

export default function Clients({ onUnauthorized }) {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  // null | 'new' | объект клиента
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    () =>
      fetchClients()
        .then(setClients)
        .catch((err) => {
          if (err.status === 401) return onUnauthorized();
          return setError(err.message);
        }),
    [onUnauthorized],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function remove(client) {
    if (!window.confirm(`Удалить клиента «${client.name}»?`)) return;
    setError('');
    try {
      await deleteClient(client._id);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button onClick={() => setEditing('new')}>Новый клиент</button>
      </div>

      {error && <p className="error">{error}</p>}

      {editing && (
        <ClientForm
          client={editing === 'new' ? null : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
          onDelete={editing === 'new' ? null : () => remove(editing)}
        />
      )}

      {clients.length === 0 && <p className="muted">Клиентов пока нет.</p>}

      <div className="list">
        {clients.map((c) => (
          <article
            key={c._id}
            className="row-card"
            role="button"
            tabIndex={0}
            onClick={() => setEditing(c)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(c)}
          >
            <div>
              <strong>{c.name}</strong>
              {c.company && <span className="muted"> · {c.company}</span>}
            </div>
            <div className="muted">
              {RATE_LABELS[c.rate?.kind]}: {c.rate?.amount} {c.rate?.currency}
              {' · '}проектов: {c.projects.length}
              {' · '}затраты {formatUsd(c.costUsd)}
            </div>
            {c.projects.length > 0 && (
              <div className="muted">{c.projects.map((p) => p.name).join(', ')}</div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
