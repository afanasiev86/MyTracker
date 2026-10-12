import { useState } from 'react';

// Подписи авторов комментариев для владельца
const COMMENT_AUTHORS = { owner: 'Вы', client: 'Заказчик', system: 'Система', worker: 'Исполнитель' };

// Комментарии и форма нового. Отправка делегируется родителю: onAdd(text, visibleToClient).
export default function CommentsSection({ comments, busy, onAdd }) {
  const [comment, setComment] = useState('');
  const [visibleToClient, setVisibleToClient] = useState(false);
  return (
    <>
      <h3>Комментарии</h3>
      {comments.length === 0 && (
        <p className="muted">Комментариев нет. Claude читает их при следующем запуске, поэтому здесь можно написать доработку.</p>
      )}
      {comments.length > 0 && (
        <ul>
          {comments.map((c, i) => (
            <li key={i}>
              <span className="muted">{COMMENT_AUTHORS[c.author] ?? c.author}: </span>
              {c.text}
              {c.visibleToClient && c.author !== 'client' && <span className="muted"> · видно заказчику</span>}
            </li>
          ))}
        </ul>
      )}
      <form
        className="comment-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          if (await onAdd(comment.trim(), visibleToClient)) {
            setComment('');
            setVisibleToClient(false);
          }
        }}
      >
        <label className="full">
          Новый комментарий
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Что исправить или уточнить"
          />
        </label>
        <label className="full">
          <input type="checkbox" checked={visibleToClient} onChange={(e) => setVisibleToClient(e.target.checked)} />
          {' '}Показать заказчику в портале
        </label>
        <button type="submit" disabled={busy || !comment.trim()}>Добавить комментарий</button>
      </form>
    </>
  );
}
