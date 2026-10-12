import { useState } from 'react';
import { deleteClient, revokeClientPortal } from '../api.js';
import { confirmAction } from '../lib/telegram/confirm.js';
import ClientForm from './ClientForm.jsx';
import AccessRequests from './AccessRequests.jsx';
import ClientCard from './clients/ClientCard.jsx';
import { useClients } from './clients/useClients.js';

export { formatRate } from './clients/formatRate.js';

export default function Clients() {
  const { clients, loaded, error, setError, load } = useClients();
  const [notice, setNotice] = useState('');
  // null | 'new' | объект клиента
  const [editing, setEditing] = useState(null);

  function saved(message) {
    setEditing(null);
    setNotice(message);
    load();
  }

  async function closePortal(client) {
    const ok = await confirmAction(`Закрыть «${client.name}» доступ к порталу? Он перестанет видеть свои задачи.`);
    if (!ok) return;
    setError('');
    try {
      await revokeClientPortal(client._id);
      setNotice(`Портал для «${client.name}» закрыт`);
      load();
    } catch (err) {
      setError(err.message);
    }
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

      <AccessRequests onChanged={load} />

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
          <ClientCard
            key={c._id}
            client={c}
            onOpen={(client) => { setNotice(''); setEditing(client); }}
            onClosePortal={closePortal}
          />
        ))}
      </div>
    </>
  );
}
