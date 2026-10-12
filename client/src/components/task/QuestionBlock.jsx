import { useState } from 'react';

// Вопрос Claude и форма ответа. Отправка делегируется родителю.
export default function QuestionBlock({ task, busy, onAnswer }) {
  const [answer, setAnswer] = useState('');
  return (
    <section className="question" aria-label="Вопрос Claude">
      <p className="question-label">Claude спрашивает</p>
      <p>{task.pendingQuestion || 'Вопрос не сохранён, посмотрите комментарии и последний запуск.'}</p>
      <form
        className="comment-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!answer.trim()) return;
          if (await onAnswer(answer.trim())) setAnswer('');
        }}
      >
        <label className="full">
          Ваш ответ
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} />
        </label>
        <button type="submit" disabled={busy || !answer.trim()}>Ответить и продолжить</button>
      </form>
    </section>
  );
}
