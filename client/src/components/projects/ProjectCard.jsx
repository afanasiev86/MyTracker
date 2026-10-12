import { Card, Flex, Tag, Typography } from 'antd';
import { PROJECT_STATUS_LABELS } from '../../../../shared/crm.js';
import { formatUsd } from '../../lib/cost.js';

const STATUS_COLORS = { active: 'green', paused: 'gold', done: 'default' };

// Карточка проекта: название, статус, клиент, срок и затраты
export default function ProjectCard({ project, onOpen }) {
  const p = project;
  return (
    <Card
      hoverable
      size="small"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(p)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(p)}
    >
      <Flex wrap align="center" gap={8}>
        <Typography.Text strong>{p.name}</Typography.Text>
        <Typography.Text type="secondary">{p.slug}</Typography.Text>
        <Tag color={STATUS_COLORS[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Tag>
      </Flex>
      <Typography.Text type="secondary" style={{ display: 'block' }}>
        {p.client && `Клиент ${p.client.name}`}
        {p.client && p.deadline && ' · '}
        {p.deadline && `срок ${new Date(p.deadline).toLocaleDateString('ru-RU')}`}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block' }}>
        Задач: {p.stats.tasks}, открыто {p.stats.open} · затраты на Claude {formatUsd(p.stats.costUsd)}
      </Typography.Text>
    </Card>
  );
}
