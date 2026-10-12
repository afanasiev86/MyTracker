import { Alert, Card } from 'antd';
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
    <Card size="small" title="Запросы доступа к порталу" aria-label="Запросы доступа" style={{ marginBottom: 12 }}>
      {requests.map((r) => (
        <AccessRow key={r._id} request={r} clients={free} onAct={act} />
      ))}
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 8 }} />}
    </Card>
  );
}
