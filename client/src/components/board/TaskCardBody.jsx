import { Flex, Tag, Typography } from 'antd';
import { PRIORITY_LABELS } from '../../../../shared/crm.js';
import { sumRunCosts, formatUsd } from '../../lib/cost.js';

// Содержимое карточки задачи на доске
export default function TaskCardBody({ task }) {
  const cost = sumRunCosts(task.runs);
  return (
    <>
      <Typography.Text strong>
        {task.priority === 'high' && <Tag color="red" title={PRIORITY_LABELS.high}>Срочно</Tag>}
        {task.title}
      </Typography.Text>
      <Flex wrap gap={4} align="center">
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {task.project}
          {task.dueDate && ` · до ${new Date(task.dueDate).toLocaleDateString('ru-RU')}`}
        </Typography.Text>
        {cost > 0 && <Tag color="blue" bordered={false}>{formatUsd(cost)}</Tag>}
      </Flex>
    </>
  );
}
