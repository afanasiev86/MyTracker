import { Button, Card, Flex, Tag, Typography } from 'antd';
import { formatUsd } from '../../lib/cost.js';
import { formatRate } from './formatRate.js';

// Карточка клиента: ставка, проекты, затраты и состояние портала
export default function ClientCard({ client, onOpen, onClosePortal }) {
  return (
    <Card
      hoverable
      size="small"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(client)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(client)}
    >
      <Flex wrap align="center" gap={8}>
        <Typography.Text strong>{client.name}</Typography.Text>
        {client.company && <Typography.Text type="secondary">{client.company}</Typography.Text>}
      </Flex>
      <Typography.Text type="secondary" style={{ display: 'block' }}>
        {formatRate(client.rate)} · проектов: {client.projects.length} · затраты на Claude {formatUsd(client.costUsd)}
      </Typography.Text>
      {client.projects.length > 0 && (
        <Typography.Text type="secondary" style={{ display: 'block' }}>
          {client.projects.map((p) => p.name).join(', ')}
        </Typography.Text>
      )}
      {client.telegramId ? (
        <Flex align="center" gap={8} style={{ marginTop: 8 }}>
          <Tag color="green">Портал открыт</Tag>
          <Button
            size="small"
            onClick={(e) => { e.stopPropagation(); onClosePortal(client); }}
          >
            Закрыть доступ
          </Button>
        </Flex>
      ) : (
        <Typography.Text type="secondary" style={{ display: 'block' }}>
          Портал не подключён: подтвердите запрос выше
        </Typography.Text>
      )}
    </Card>
  );
}
