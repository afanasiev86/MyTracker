import { Button, Flex } from 'antd';
import { CaretRightOutlined, CheckOutlined, CodeOutlined, StopOutlined } from '@ant-design/icons';
import { STATUS_LABELS, RUNNABLE_FROM, allowedTargets } from '../../../../shared/statuses.js';

// Подписи действий описывают, что произойдёт, а не новый статус
const ACTION_LABELS = {
  ready: 'Отдать в работу',
  backlog: 'Вернуть в бэклог',
  done: 'Принять результат',
};

// Кнопки действий над задачей: главное действие сверху, остальные под ним
export default function ActionBar({ task, busy, diffShown, onCancel, onRun, onTransition, onToggleDiff }) {
  const targets = allowedTargets(task.status);
  const canRun = RUNNABLE_FROM.includes(task.status);
  const runLabel = task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude';
  // Принять результат важнее запуска только на проверке, там главное действие — приёмка
  const acceptIsPrimary = task.status === 'review';
  return (
    <Flex vertical gap={8}>
      {task.status === 'in_progress' && (
        <Button danger block icon={<StopOutlined />} disabled={busy} onClick={onCancel}>
          Отменить запуск
        </Button>
      )}
      {canRun && (
        <Button
          block
          type={acceptIsPrimary ? 'default' : 'primary'}
          icon={<CaretRightOutlined />}
          disabled={busy}
          onClick={onRun}
        >
          {runLabel}
        </Button>
      )}
      {targets.map((status) => (
        <Button
          key={status}
          block
          type={status === 'done' ? 'primary' : 'default'}
          icon={status === 'done' ? <CheckOutlined /> : undefined}
          disabled={busy}
          onClick={() => onTransition(status)}
        >
          {ACTION_LABELS[status] || STATUS_LABELS[status]}
        </Button>
      ))}
      {task.branch && (
        <Button block type="text" icon={<CodeOutlined />} onClick={onToggleDiff}>
          {diffShown ? 'Скрыть diff' : 'Показать diff'}
        </Button>
      )}
    </Flex>
  );
}
