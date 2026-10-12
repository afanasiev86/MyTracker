import { Flex, Tag, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { STATUS_LABELS } from '../../../../shared/statuses.js';
import { KIND_LABELS } from '../../../../shared/taskKinds.js';
import { PRIORITY_LABELS } from '../../../../shared/crm.js';
import { STATUS_COLORS } from './statusMeta.js';

// Шапка карточки: статус с цветной полосой, название и главные признаки задачи
export default function TaskHeader({ task }) {
  const color = STATUS_COLORS[task.status];
  return (
    <header className="task-header" style={{ borderLeftColor: color }}>
      <Flex align="center" gap={8} className="task-status">
        <span className="task-status-dot" style={{ background: color }} aria-hidden="true" />
        <Typography.Text strong style={{ color }}>{STATUS_LABELS[task.status]}</Typography.Text>
      </Flex>
      <Typography.Title level={3} className="task-title">{task.title}</Typography.Title>
      <Flex wrap gap={4}>
        <Tag bordered={false}>{task.project}</Tag>
        <Tag bordered={false}>{KIND_LABELS[task.kind] ?? KIND_LABELS.other}</Tag>
        {task.priority === 'high' && <Tag color="red" title={PRIORITY_LABELS.high}>Срочно</Tag>}
        {task.dueDate && (
          <Tag bordered={false} icon={<CalendarOutlined />}>
            до {new Date(task.dueDate).toLocaleDateString('ru-RU')}
          </Tag>
        )}
      </Flex>
    </header>
  );
}
