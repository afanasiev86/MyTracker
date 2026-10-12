import { useState } from 'react';
import { Alert, Button, Card, Flex, Popconfirm, Tag, Typography } from 'antd';
import { startDeploy } from '../../api.js';

// Обновление MyTracker с GitHub: версия на сервере, запуск и итог прошлого обновления
export default function DeployCard({ deploy, onStarted, onError }) {
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      await startDeploy();
      onStarted();
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const { last } = deploy;
  return (
    <Card
      title="Обновление MyTracker"
      style={{ marginBottom: 16 }}
      extra={deploy.commit && <Tag>версия {deploy.commit}</Tag>}
    >
      <Typography.Paragraph type="secondary">
        Получает последнюю версию из GitHub, собирает её и перезапускает API. Если новая версия не соберётся или не запустится,
        вернётся прежняя. О результате напишет бот.
      </Typography.Paragraph>

      {deploy.running && <Alert type="info" showIcon message="Обновление идёт. Страница может ненадолго потерять связь при перезапуске API." style={{ marginBottom: 12 }} />}
      {!deploy.running && last && (
        <Alert
          type={last.ok ? 'success' : 'error'}
          showIcon
          message={last.message}
          description={last.finishedAt && new Date(last.finishedAt).toLocaleString('ru-RU')}
          style={{ marginBottom: 12 }}
        />
      )}

      <Flex>
        <Popconfirm
          title="Обновить MyTracker до последней версии?"
          description="API будет перезапущен."
          okText="Обновить"
          cancelText="Отмена"
          onConfirm={start}
        >
          <Button type="primary" loading={busy} disabled={deploy.running}>Обновить MyTracker</Button>
        </Popconfirm>
      </Flex>
    </Card>
  );
}
