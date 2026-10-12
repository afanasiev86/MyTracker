import { Alert } from 'antd';

// Текущий шаг Claude, пока задача в работе
export default function ProgressBlock({ task }) {
  return (
    <Alert
      type="info"
      showIcon
      aria-label="Ход запуска"
      message="Claude работает"
      description={task.progress || 'Запуск…'}
      style={{ marginBottom: 16 }}
    />
  );
}
