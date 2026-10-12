import { useState } from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Alert, Button, Flex } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { deleteClient, revokeClientPortal } from '../api.js';
import { confirmAction } from '../lib/telegram/confirm.js';
import AccessRequests from './AccessRequests.jsx';
import Loading from './Loading.jsx';
import ClientCard from './clients/ClientCard.jsx';
import { useClients } from './clients/useClients.js';

export { formatRate } from './clients/formatRate.js';

export default function Clients() {
  const { clients, loaded, error, setError, load } = useClients();
  const [notice, setNotice] = useState('');
  const navigate = useNavigate();
  const formOpen = Boolean(useMatch('/clients/:view'));

  function saved(message) {
    navigate('/clients');
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
      navigate('/clients');
      setNotice(`Клиент «${client.name}» удалён`);
      load();
    } catch (err) {
      // Сервер не даёт удалить клиента с проектами, объясняем это здесь же
      setError(err.message);
    }
  }

  return (
    <>
      <Flex gap={8} style={{ marginBottom: 12 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setNotice(''); navigate('/clients/new'); }}>
          Новый клиент
        </Button>
      </Flex>

      <AccessRequests onChanged={load} />

      {notice && !formOpen && <Alert type="success" showIcon message={notice} closable onClose={() => setNotice('')} style={{ marginBottom: 12 }} />}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 12 }} />}

      <Outlet context={{ clients, loaded, saved, remove }} />

      {!loaded && <Loading text="Загружаем клиентов…" />}
      {loaded && clients.length === 0 && (
        <Alert type="info" showIcon message="Клиентов пока нет. Добавьте клиента и привяжите к нему проекты." />
      )}

      <Flex vertical gap={8}>
        {clients.map((c) => (
          <ClientCard
            key={c._id}
            client={c}
            onOpen={(client) => { setNotice(''); navigate(`/clients/${client._id}`); }}
            onClosePortal={closePortal}
          />
        ))}
      </Flex>
    </>
  );
}
