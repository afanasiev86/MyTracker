import { useEffect, useState } from 'react';
import { fetchTasks } from '../api.js';

export const COLUMNS = [
  { status: 'backlog', title: 'Бэклог' },
  { status: 'ready', title: 'Готово к работе' },
  { status: 'in_progress', title: 'В работе' },
  { status: 'review', title: 'На проверке' },
  { status: 'done', title: 'Готово' },
  { status: 'failed', title: 'Ошибка' },
];

export default function Board({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((err) => {
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
      });
  }, [onUnauthorized]);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.status);
        return (
          <section className="column" key={col.status}>
            <h2>
              {col.title} <span className="count">{items.length}</span>
            </h2>
            {items.map((t) => (
              <article className="card" key={t._id}>
                <strong>{t.title}</strong>
                <small>{t.project}</small>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
