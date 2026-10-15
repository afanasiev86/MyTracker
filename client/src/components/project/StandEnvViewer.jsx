import { useState } from 'react';
import { Alert, Button, Descriptions, Flex, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { fetchStandEnv } from '../../api.js';

// Просмотр .env UAT-стенда: порт, адрес и пароли, которые трекер передал приложению.
// Файл загружается по кнопке, пароли скрыты, пока их не покажут по одному.
export default function StandEnvViewer({ projectId }) {
  const [env, setEnv] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(() => new Set());

  async function load() {
    setLoading(true);
    setError('');
    try {
      setEnv(await fetchStandEnv(projectId));
      setShown(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const reveal = (key) => setShown((current) => new Set(current).add(key));

  const items = (env?.entries ?? []).map(({ key, value, secret }) => ({
    key,
    label: key,
    children: secret && !shown.has(key)
      ? (
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary">••••••••</Typography.Text>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => reveal(key)} aria-label={`Показать ${key}`}>показать</Button>
        </Flex>
      )
      : <Typography.Text code copyable>{value}</Typography.Text>,
  }));

  return (
    <section aria-label="Переменные стенда" style={{ marginTop: 16 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>Переменные стенда (.env)</Typography.Text>
        {env
          ? <Button size="small" onClick={() => setEnv(null)}>Скрыть</Button>
          : <Button size="small" icon={<EyeOutlined />} loading={loading} onClick={load}>Показать .env</Button>}
      </Flex>
      {error && <Alert type="error" showIcon message={error} />}
      {env && !env.exists && <Alert type="info" showIcon message="Файла ещё нет: он создаётся при первой сборке стенда." />}
      {env?.exists && (
        <>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            Файл на сервере: <Typography.Text code>{env.path}</Typography.Text>. Остальные переменные приложения лежат в compose.yml рядом.
          </Typography.Paragraph>
          <Descriptions bordered size="small" column={1} items={items} />
        </>
      )}
    </section>
  );
}
