import { formatUsd } from '../../lib/cost.js';
import { totalCostOf } from './filterTasks.js';

// Итог затрат на Claude: общий и по проектам
export default function CostSummary({ costs }) {
  if (costs.length === 0) return null;
  return (
    <p className="cost-summary">
      Всего: <b>{formatUsd(totalCostOf(costs))}</b>
      {costs.map((c) => (
        <span key={c.project}> · {c.project}: {formatUsd(c.costUsd)}</span>
      ))}
    </p>
  );
}
