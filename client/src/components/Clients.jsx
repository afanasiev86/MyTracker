import { useCallback, useEffect, useState } from 'react';
import { fetchClients, deleteClient } from '../api.js';
import { formatUsd } from '../lib/cost.js';
import { confirmAction } from '../lib/telegram.js';
import ClientForm from './ClientForm.jsx';

// Ставка с единицей измерения: «2000 RUB в час» или «150000 RUB за проект»
export function formatRate(rate) {
  if (!rate) return 'Ставка не задана';
  const amount = `${rate.amount} ${rate.currency}`;
  return rate.kind === 'hourly' ? `${amount} в час` : `${amount} за проект`;
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // null | 'new' | объект клиента
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    () =>
      fetchClients()
        .then(setClients)
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  function saved(message) {
    setEditing(null);
    setNotice(message);
    load();
  }

  async function remove(client) {
    const ok = await confirmAction(`Удалить клиента «${client.name}»?`);
    if (!ok) return;
    setError('');
    try {
      await deleteClient(client._id);
      setEditing(null);
      setNotice(`Клиент «${client.name}» удалён`);
      load();
    } catch (err) {
      // Сервер не даёт удалить клиента с проектами, объясняем это здесь же
      setError(err.message);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button onClick={() => { setNotice(''); setEditing('new'); }}>Новый клиент</button>
      </div>

      {notice && !editing && <p className="notice">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {editing && (
        <ClientForm
          client={editing === 'new' ? null : editing}
          onSaved={() => saved(editing === 'new' ? 'Клиент добавлен' : 'Изменения сохранены')}
          onCancel={() => setEditing(null)}
          onDelete={editing === 'new' ? null : () => remove(editing)}
        />
      )}

      {!loaded && <p className="muted">Загружаем клиентов…</p>}
      {loaded && clients.length === 0 && (
        <p className="muted">Клиентов пока нет. Добавьте клиента и привяжите к нему проекты.</p>
      )}

      <div className="list">
        {clients.map((c) => (
          <article
            key={c._id}
            className="row-card"
            role="button"
            tabIndex={0}
            onClick={() => { setNotice(''); setEditing(c); }}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(c)}
          >
            <div>
              <strong>{c.name}</strong>
              {c.company && <span className="muted"> · {c.company}</span>}
            </div>
            <div className="muted">
              {formatRate(c.rate)} · проектов: {c.projects.length} · затраты на Claude {formatUsd(c.costUsd)}
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
