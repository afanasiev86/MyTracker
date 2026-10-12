import { useState } from 'react';
import { postPortalComment } from '../../api.js';

// Форма комментария заказчика. После отправки поле очищается и вызывается onSent.
export default function CommentForm({ taskId, onSent }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      await postPortalComment(taskId, text.trim());
      setText('');
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="comment-form" onSubmit={send}>
        <label className="full">
          Ваш комментарий
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        </label>
        <button type="submit" disabled={busy || !text.trim()}>Отправить</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
