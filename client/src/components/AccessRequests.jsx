import { useEffect, useState } from 'react';
import { fetchAccessRequests, fetchClients, approveAccessRequest, rejectAccessRequest } from '../api.js';

// Запросы доступа к порталу: вы подтверждаете человека и привязываете его к клиенту
export default function AccessRequests({ onChanged }) {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  function load() {
    Promise.resolve()
      .then(() => Promise.all([fetchAccessRequests(), fetchClients()]))
      .then(([reqs, list]) => {
        setRequests(reqs ?? []);
        setClients(list ?? []);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(action) {
    setError('');
    try {
      await action();
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  if (requests.length === 0 && !error) return null;

  // Клиенты, к которым ещё не привязан портал
  const free = clients.filter((c) => !c.telegramId);

  return (
    <section className="panel" aria-label="Запросы доступа">
      <h3>Запросы доступа к порталу</h3>
      {requests.map((r) => (
        <AccessRow key={r._id} request={r} clients={free} onAct={act} />
      ))}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function AccessRow({ request, clients, onAct }) {
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
