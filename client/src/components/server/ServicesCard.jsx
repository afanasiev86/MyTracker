import { useState } from 'react';
import { Button, Card, Flex, List, Popconfirm, Tag, Typography } from 'antd';
import { controlService } from '../../api.js';
import LogsModal from './LogsModal.jsx';

const STATUS = {
  active: { label: 'работает', color: 'green' },
  inactive: { label: 'остановлен', color: 'default' },
  failed: { label: 'сбой', color: 'red' },
  activating: { label: 'запускается', color: 'gold' },
  deactivating: { label: 'останавливается', color: 'gold' },
  unknown: { label: 'неизвестно', color: 'default' },
};

const ACTIONS = {
  restart: { label: 'Перезапустить', question: 'Перезапустить' },
  start: { label: 'Запустить', question: 'Запустить' },
  stop: { label: 'Остановить', question: 'Остановить', danger: true },
};

// Сервисы из разрешённого списка: состояние, управление и журнал. Каждое действие подтверждается.
export default function ServicesCard({ services, onChanged, onError }) {
  const [busy, setBusy] = useState('');
  const [logsOf, setLogsOf] = useState(null);

  async function act(service, action) {
    setBusy(`${service.id}:${action}`);
    try {
      const result = await controlService(service.id, action);
      onChanged(result.scheduled ? `«${service.label}» перезапускается, вернётся через несколько секунд.` : '');
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <Card title="Сервисы" style={{ marginBottom: 16 }}>
      <List
        dataSource={services}
        renderItem={(service) => {
          const status = STATUS[service.status] ?? STATUS.unknown;
          // Запуск имеет смысл у остановленного, остановка и перезапуск — у работающего
          const offered = service.actions.filter((a) => (a === 'start' ? service.status !== 'active' : true));
          return (
            <List.Item>
              <Flex justify="space-between" align="center" wrap gap={8} style={{ width: '100%' }}>
                <Flex align="center" gap={8}>
                  <Typography.Text strong>{service.label}</Typography.Text>
                  <Tag color={status.color}>{status.label}</Tag>
                </Flex>
                <Flex wrap gap={8}>
                  {offered.map((action) => (
                    <Popconfirm
                      key={action}
                      title={`${ACTIONS[action].question} «${service.label}»?`}
                      okText="Подтвердить"
                      cancelText="Отмена"
                      okButtonProps={{ danger: ACTIONS[action].danger }}
                      onConfirm={() => act(service, action)}
                    >
                      <Button danger={ACTIONS[action].danger} loading={busy === `${service.id}:${action}`} disabled={Boolean(busy)}>
                        {ACTIONS[action].label}
                      </Button>
                    </Popconfirm>
                  ))}
                  <Button onClick={() => setLogsOf(service)}>Журнал</Button>
                </Flex>
              </Flex>
            </List.Item>
          );
        }}
      />
      {logsOf && <LogsModal service={logsOf} onClose={() => setLogsOf(null)} />}
    </Card>
  );
}
