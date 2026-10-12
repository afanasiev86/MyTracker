import { useAccessRequests } from './access/useAccessRequests.js';
import AccessRow from './access/AccessRow.jsx';

// Запросы доступа к порталу: вы подтверждаете человека и привязываете его к клиенту
export default function AccessRequests({ onChanged }) {
  const { requests, clients, error, setError, load } = useAccessRequests();

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
