import { Flex, Tag, Typography } from 'antd';
import { formatUsd } from '../../lib/cost.js';
import { totalCostOf } from './filterTasks.js';

// Итог затрат на Claude: общий и по проектам
export default function CostSummary({ costs }) {
  if (costs.length === 0) return null;
  return (
    <Flex wrap align="center" gap={4} style={{ marginBottom: 12 }}>
      <Typography.Text>Всего: <b>{formatUsd(totalCostOf(costs))}</b></Typography.Text>
      {costs.map((c) => (
        <Tag key={c.project} bordered={false}>{c.project}: {formatUsd(c.costUsd)}</Tag>
      ))}
    </Flex>
  );
}
