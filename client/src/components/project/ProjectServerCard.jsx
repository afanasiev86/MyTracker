import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Flex, Tag, Typography } from 'antd';
import { CaretRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { fetchProjectServer, startProjectStand } from '../../api.js';
import { formatBytes } from '../../lib/bytes.js';

const BUILD_POLL_MS = 5000;

// Как показать стенд: сначала то, что реально запущено, затем итог последней сборки
function standState(stand) {
  if (stand.status === 'building') return { color: 'processing', label: 'Собирается' };
  if (stand.runtime?.running > 0) return { color: 'success', label: `Запущен (контейнеров: ${stand.runtime.running} из ${stand.runtime.containers})` };
  if (stand.runtime?.containers > 0) return { color: 'warning', label: 'Остановлен' };
  if (stand.status === 'failed') return { color: 'error', label: 'Ошибка сборки' };
  return { color: 'default', label: 'Не запускался' };
}

// Блок «На сервере» в карточке проекта: локальная копия и UAT-стенд
export default function ProjectServerCard({ projectId }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInfo(await fetchProjectServer(projectId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // Пока стенд собирается, состояние подтягивается само
  const building = info?.stand?.status === 'building';
  useEffect(() => {
    if (!building) return undefined;
    const timer = setInterval(load, BUILD_POLL_MS);
    return () => clearInterval(timer);
  }, [building, load]);

  async function start() {
    setStarting(true);
    setError('');
    try {
      await startProjectStand(projectId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  const copy = info?.localCopy;
  const stand = info?.stand;
  const state = stand?.enabled ? standState(stand) : null;
  const items = [];
  if (copy) {
    items.push({
      key: 'copy',
      label: 'Локальная копия',
      children: !copy.configured
        ? 'Папка проектов не настроена (REPOS_DIR)'
        : copy.exists
          ? <Typography.Text code copyable>{copy.path}</Typography.Text>
          : <span>Нет папки <Typography.Text code>{copy.path}</Typography.Text>. Сохраните проект: репозиторий склонируется.</span>,
    });
    if (copy.exists) items.push({ key: 'size', label: 'Размер копии', children: formatBytes(copy.sizeBytes) });
  }
  if (stand) {
    items.push({
      key: 'stand',
      label: 'UAT-стенд',
      children: !stand.enabled
        ? 'Нет: UAT выключен или проект пушит сразу в ПРОД'
        : (
          <Flex vertical gap={4}>
            <span><Tag color={state.color}>{state.label}</Tag>{stand.runtime?.running > 0 && <a href={stand.url} target="_blank" rel="noreferrer">{stand.url}</a>}</span>
            {stand.commit && <Typography.Text type="secondary">Коммит {stand.commit}</Typography.Text>}
            {stand.status === 'failed' && stand.error && <Typography.Text type="danger">{stand.error}</Typography.Text>}
            {stand.runtime?.error && <Typography.Text type="danger">Docker: {stand.runtime.error}</Typography.Text>}
            {stand.status === 'none' && (
              <div>
                <Button type="primary" size="small" icon={<CaretRightOutlined />} loading={starting} onClick={start}>Запустить UAT</Button>
                <Typography.Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                  Создаст ветку {stand.branch} от основной, если её нет, и соберёт стенд. Первая сборка занимает несколько минут.
                </Typography.Paragraph>
              </div>
            )}
          </Flex>
        ),
    });
    if (stand.enabled && stand.runtime?.running > 0) {
      items.push({ key: 'memory', label: 'Память стенда', children: formatBytes(stand.runtime.memoryBytes) });
    }
  }

  return (
    <section aria-label="На сервере" style={{ marginTop: 24 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>На сервере</Typography.Title>
        <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={load}>Обновить</Button>
      </Flex>
      {error && <Alert type="error" showIcon message={error} />}
      {items.length > 0 && <Descriptions bordered size="small" column={1} items={items} />}
    </section>
  );
}
