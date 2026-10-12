import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Flex, Form, Input, List, Tag, Typography } from 'antd';
import { fetchPortalMe, fetchPortalTasks, postPortalComment } from '../api.js';
import Loading from './Loading.jsx';
import Field from './Field.jsx';

// Подписи авторов комментариев для заказчика
const AUTHORS = { client: 'Вы', owner: 'Исполнитель' };

// Портал заказчика: задачи его проектов, статусы и комментарии. Внутренние детали здесь не показываются.
export default function Portal() {
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    () =>
      Promise.all([fetchPortalMe(), fetchPortalTasks()])
        .then(([me, list]) => {
          setName(me.name);
          setTasks(list);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <Loading text="Загружаем ваши задачи…" />;
  if (error) return <Alert type="error" showIcon message={error} />;

  // Группируем по проектам, сохраняя порядок от нового к старому
  const byProject = new Map();
  for (const t of tasks) {
    if (!byProject.has(t.project)) byProject.set(t.project, []);
    byProject.get(t.project).push(t);
  }

  return (
    <section>
      <Typography.Title level={4}>Здравствуйте{name ? `, ${name}` : ''}</Typography.Title>
      {tasks.length === 0 && (
        <Alert type="info" showIcon message="Задач пока нет. Они появятся здесь, когда исполнитель начнёт работу." />
      )}
      {[...byProject.entries()].map(([project, items]) => (
        <div key={project}>
          <Divider orientation="left">{project}</Divider>
          <Flex vertical gap={8}>
            {items.map((t) => <PortalTask key={t.id} task={t} onChanged={load} />)}
          </Flex>
        </div>
      ))}
    </section>
  );
}

function PortalTask({ task, onChanged }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await postPortalComment(task.id, text.trim());
      setText('');
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      size="small"
      title={<Typography.Text strong>{task.title}</Typography.Text>}
      extra={<Tag color="blue">{task.statusLabel}</Tag>}
    >
      {task.goal && <Typography.Paragraph>{task.goal}</Typography.Paragraph>}
      {task.acceptance.length > 0 && (
        <ul>
          {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {task.dueDate && (
        <Typography.Paragraph type="secondary">
          Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
        </Typography.Paragraph>
      )}

      {task.comments.length > 0 && (
        <List
          size="small"
          dataSource={task.comments}
          renderItem={(c) => (
            <List.Item>
              <span>
                <Typography.Text type="secondary">{AUTHORS[c.author]}: </Typography.Text>{c.text}
              </span>
            </List.Item>
          )}
        />
      )}

      <Form layout="vertical" onFinish={send} style={{ marginTop: 12 }}>
        <Field label="Ваш комментарий">
          <Input.TextArea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        </Field>
        <Button type="primary" htmlType="submit" loading={busy} disabled={!text.trim()}>Отправить</Button>
      </Form>
      {error && <Alert type="error" showIcon message={error} style={{ marginTop: 12 }} />}
    </Card>
  );
}
