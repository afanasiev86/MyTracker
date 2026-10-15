import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import Field from '../Field.jsx';

// Причина ошибки (итог последнего запуска) и просьба к Claude исправить её.
// Подсказка необязательна. Отправка делегируется родителю: он возвращает true при успехе.
export default function FailureBlock({ task, busy, onFix }) {
  const [hint, setHint] = useState('');
  const reason = task.runs?.at(-1)?.summary;
  return (
    <section aria-label="Ошибка запуска" style={{ marginBottom: 16 }}>
      <Alert
        type="error"
        showIcon
        message="Запуск завершился ошибкой"
        description={reason || 'Причина не сохранена, посмотрите вкладку «Запуски».'}
        style={{ marginBottom: 12, whiteSpace: 'pre-wrap' }}
      />
      <Form
        layout="vertical"
        onFinish={async () => {
          if (await onFix(hint.trim())) setHint('');
        }}
      >
        <Field
          label="Подсказка для Claude (необязательно)"
          extra="Claude получит причину ошибки и конец лога запуска. Если знаете, в чём дело, напишите здесь."
        >
          <Input.TextArea value={hint} onChange={(e) => setHint(e.target.value)} rows={2} maxLength={4000} />
        </Field>
        <Button type="primary" htmlType="submit" icon={<ToolOutlined />} disabled={busy}>
          Попросить Claude исправить
        </Button>
      </Form>
    </section>
  );
}
