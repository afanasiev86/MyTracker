import { Typography, theme } from 'antd';
import { PRIORITY_LABELS } from '../../../../shared/crm.js';
import { sumRunCosts, formatUsd } from '../../lib/cost.js';
import ActionBar from './ActionBar.jsx';

const formatDate = (value) => new Date(value).toLocaleDateString('ru-RU');

// Боковая панель: действия над задачей и реквизиты
export default function TaskSidebar({ task, actionProps }) {
  const { token } = theme.useToken();
  const cost = sumRunCosts(task.runs);
  const rows = [
    ['Приоритет', PRIORITY_LABELS[task.priority]],
    ['Срок', task.dueDate ? formatDate(task.dueDate) : 'не задан'],
    task.branch && ['Ветка', <Typography.Text code key="branch">{task.branch}</Typography.Text>],
    cost > 0 && ['Затраты на Claude', formatUsd(cost)],
    task.updatedAt && ['Обновлена', formatDate(task.updatedAt)],
  ].filter(Boolean);

  return (
    <aside className="task-side">
      <ActionBar task={task} {...actionProps} />
      <dl
        className="task-facts"
        style={{ background: token.colorFillAlter, borderRadius: token.borderRadiusLG }}
      >
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
