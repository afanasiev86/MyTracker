import { Alert } from 'antd';

const TIME_FORMAT = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

// Состояние UAT-стенда проекта: ссылка, когда он готов, и причина, когда не собрался.
// Стенд один на проект и показывает всю ветку UAT, поэтому блок одинаков у всех задач проекта.
export default function StandBlock({ stand }) {
  if (!stand || stand.status === 'none') return null;
  const common = { showIcon: true, style: { marginBottom: 16, whiteSpace: 'pre-wrap' } };
  if (stand.status === 'building') {
    return <Alert {...common} type="info" message="Стенд UAT собирается" description="Сборка занимает несколько минут: страница обновится, когда она закончится." />;
  }
  if (stand.status === 'failed') {
    return <Alert {...common} type="error" message="Стенд UAT не собрался" description={stand.error || 'Причина не сохранена'} />;
  }
  return (
    <Alert
      {...common}
      type="success"
      message={<a href={stand.url} target="_blank" rel="noreferrer">Стенд UAT: {stand.url}</a>}
      description={`Коммит ${stand.commit}${stand.builtAt ? `, собран ${TIME_FORMAT.format(new Date(stand.builtAt))}` : ''}. Логин и пароль общие для всех стендов.`}
    />
  );
}
