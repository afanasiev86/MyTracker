import { useState } from 'react';
import { Button, Flex, Select, Typography } from 'antd';
import { approveAccessRequest, rejectAccessRequest } from '../../api.js';

// Один запрос: выбор клиента, подтверждение или отклонение
export default function AccessRow({ request, clients, onAct }) {
  const [clientId, setClientId] = useState('');
  const who = `${request.name}${request.username ? ` ${request.username}` : ''}`;

  return (
    <Flex vertical gap={6} style={{ padding: '8px 0' }}>
      <div>
        <Typography.Text strong>{who}</Typography.Text>
        <Typography.Text type="secondary"> · запрос {new Date(request.createdAt).toLocaleString('ru-RU')}</Typography.Text>
      </div>
      <Flex wrap gap={8}>
        <Select
          value={clientId}
          onChange={setClientId}
          aria-label="Клиент"
          style={{ minWidth: 200 }}
          options={[{ value: '', label: 'Выберите клиента' }, ...clients.map((c) => ({ value: c._id, label: c.name }))]}
        />
        <Button
          type="primary"
          disabled={!clientId}
          onClick={() => onAct(() => approveAccessRequest(request._id, clientId))}
        >
          Подтвердить
        </Button>
        <Button onClick={() => onAct(() => rejectAccessRequest(request._id))}>Отклонить</Button>
      </Flex>
    </Flex>
  );
}
