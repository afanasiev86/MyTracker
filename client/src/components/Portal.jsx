import { useCallback, useEffect, useState } from 'react';
import { fetchPortalMe, fetchPortalTasks, postPortalComment } from '../api.js';

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

  if (!loaded) return <p className="muted">Загружаем ваши задачи…</p>;
  if (error) return <p className="error" role="alert">{error}</p>;

  // Группируем по проектам, сохраняя порядок от нового к старому
  const byProject = new Map();
  for (const t of tasks) {
    if (!byProject.has(t.project)) byProject.set(t.project, []);
    byProject.get(t.project).push(t);
  }

  return (
    <section>
      <h2>Здравствуйте{name ? `, ${name}` : ''}</h2>
      {tasks.length === 0 && <p className="muted">Задач пока нет. Они появятся здесь, когда исполнитель начнёт работу.</p>}
      {[...byProject.entries()].map(([project, items]) => (
        <div key={project}>
          <h3>{project}</h3>
          <div className="list">
            {items.map((t) => <PortalTask key={t.id} task={t} onChanged={load} />)}
          </div>
        </div>
      ))}
    </section>
  );
}

function PortalTask({ task, onChanged }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(e) {
    e.preventDefault();
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
    <article className="row-card">
      <div>
        <strong>{task.title}</strong>
        <span className="badge">{task.statusLabel}</span>
      </div>
      {task.goal && <p>{task.goal}</p>}
      {task.acceptance.length > 0 && (
        <ul>
          {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {task.dueDate && <p className="muted">Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}</p>}

      {task.comments.length > 0 && (
        <ul className="comments">
          {task.comments.map((c, i) => (
            <li key={i}>
              <span className="muted">{AUTHORS[c.author]}: </span>{c.text}
            </li>
          ))}
        </ul>
      )}

      <form className="comment-form" onSubmit={send}>
        <label className="full">
          Ваш комментарий
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
        </label>
        <button type="submit" disabled={busy || !text.trim()}>Отправить</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </article>
  );
}
