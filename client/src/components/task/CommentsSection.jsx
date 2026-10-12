import { useState } from 'react';
import { Avatar, Button, Checkbox, Empty, Flex, Form, Input, Typography } from 'antd';
import Field from '../Field.jsx';

// Подписи авторов комментариев для владельца
const COMMENT_AUTHORS = { owner: 'Вы', client: 'Заказчик', system: 'Система', worker: 'Исполнитель' };
const AUTHOR_COLORS = { owner: '#2563eb', client: '#722ed1', system: '#8c8c8c', worker: '#d48806' };

const formatTime = (value) => new Date(value).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

// Комментарии и форма нового. Отправка делегируется родителю: onAdd(text, visibleToClient).
export default function CommentsSection({ comments, busy, onAdd }) {
  const [comment, setComment] = useState('');
  const [visibleToClient, setVisibleToClient] = useState(false);

  async function submit() {
    if (!comment.trim()) return;
    if (await onAdd(comment.trim(), visibleToClient)) {
      setComment('');
      setVisibleToClient(false);
    }
  }

  return (
    <>
      {comments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Комментариев пока нет. Claude читает их при следующем запуске, поэтому здесь можно написать доработку."
        />
      ) : (
        <ol className="task-comments">
          {comments.map((c, i) => (
            <li key={i}>
              <Avatar size={28} style={{ background: AUTHOR_COLORS[c.author] ?? '#8c8c8c', flexShrink: 0 }}>
                {(COMMENT_AUTHORS[c.author] ?? c.author ?? '?').charAt(0)}
              </Avatar>
              <div>
                <Flex wrap align="baseline" gap={8}>
                  <Typography.Text strong>{COMMENT_AUTHORS[c.author] ?? c.author}</Typography.Text>
                  {c.createdAt && <Typography.Text type="secondary">{formatTime(c.createdAt)}</Typography.Text>}
                  {c.visibleToClient && c.author !== 'client' && (
                    <Typography.Text type="secondary">видно заказчику</Typography.Text>
                  )}
                </Flex>
                <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.text}</Typography.Paragraph>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Form layout="vertical" style={{ marginTop: 16 }} onFinish={submit}>
        <Field label="Новый комментарий">
          <Input.TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                submit();
              }
            }}
            autoSize={{ minRows: 2, maxRows: 8 }}
            placeholder="Что исправить или уточнить. Ctrl + Enter — отправить"
          />
        </Field>
        <Flex wrap justify="space-between" align="center" gap={8}>
          <Checkbox checked={visibleToClient} onChange={(e) => setVisibleToClient(e.target.checked)}>
            Показать заказчику в портале
          </Checkbox>
          <Button type="primary" htmlType="submit" disabled={busy || !comment.trim()}>
            Добавить комментарий
          </Button>
        </Flex>
      </Form>
    </>
  );
}
