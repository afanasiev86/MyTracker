import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import Field from '../Field.jsx';

// Вопрос Claude и форма ответа. Отправка делегируется родителю.
export default function QuestionBlock({ task, busy, onAnswer }) {
  const [answer, setAnswer] = useState('');
  return (
    <section aria-label="Вопрос Claude" style={{ marginBottom: 16 }}>
      <Alert
        type="warning"
        showIcon
        message="Claude спрашивает"
        description={task.pendingQuestion || 'Вопрос не сохранён, посмотрите комментарии и последний запуск.'}
        style={{ marginBottom: 12 }}
      />
      <Form
        layout="vertical"
        onFinish={async () => {
          if (!answer.trim()) return;
          if (await onAnswer(answer.trim())) setAnswer('');
        }}
      >
        <Field label="Ваш ответ">
          <Input.TextArea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} />
        </Field>
        <Button type="primary" htmlType="submit" disabled={busy || !answer.trim()}>
          Ответить и продолжить
        </Button>
      </Form>
    </section>
  );
}
