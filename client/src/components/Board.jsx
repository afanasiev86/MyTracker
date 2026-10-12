import { useCallback, useEffect, useState } from 'react';
import { fetchTasks } from '../api.js';
import { TASK_STATUSES, STATUS_LABELS } from '../../../shared/statuses.js';
import { setBackButton } from '../lib/telegram.js';
import TaskDetail from './TaskDetail.jsx';
import NewTaskForm from './NewTaskForm.jsx';

export default function Board({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [project, setProject] = useState('');
  // null | 'new' | id задачи
  const [view, setView] = useState(null);

  const load = useCallback(
    () =>
      fetchTasks()
        .then(setTasks)
        .catch((err) => {
          if (err.status === 401) return onUnauthorized();
          return setError(err.message);
        }),
    [onUnauthorized],
  );

  useEffect(() => {
    load();
  }, [load]);

  // В Telegram «Назад» закрывает открытую задачу или форму
  useEffect(() => {
    if (!view) return setBackButton(null);
    return setBackButton(() => setView(null));
  }, [view]);

  const projects = [...new Set(tasks.map((t) => t.project))].sort();
  const visible = project ? tasks.filter((t) => t.project === project) : tasks;

  return (
    <>
      <div className="toolbar">
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">Все проекты</option>
          {projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button onClick={() => setView('new')}>Новая задача</button>
      </div>

      {error && <p className="error">{error}</p>}

      {view === 'new' && (
        <NewTaskForm
          onCreated={(task) => {
            setView(task._id);
            load();
          }}
          onCancel={() => setView(null)}
        />
      )}

      {view && view !== 'new' && (
        <TaskDetail id={view} onChanged={load} onClose={() => setView(null)} />
      )}

      <div className="board">
        {TASK_STATUSES.map((status) => {
          const items = visible.filter((t) => t.status === status);
          return (
            <section className="column" key={status}>
              <h2>
                {STATUS_LABELS[status]} <span className="count">{items.length}</span>
              </h2>
              {items.map((t) => (
                <article
                  className="card"
                  key={t._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setView(t._id)}
                  onKeyDown={(e) => e.key === 'Enter' && setView(t._id)}
                >
                  <strong>{t.title}</strong>
                  <small>{t.project}</small>
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
