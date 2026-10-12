import { useCallback, useEffect, useState } from 'react';
import { fetchTasks, fetchCosts } from '../api.js';
import { TASK_STATUSES, STATUS_LABELS } from '../../../shared/statuses.js';
import { PRIORITY_LABELS } from '../../../shared/crm.js';
import { setBackButton } from '../lib/telegram.js';
import { sumRunCosts, formatUsd } from '../lib/cost.js';
import TaskDetail from './TaskDetail.jsx';
import NewTaskForm from './NewTaskForm.jsx';

export default function Board({ onUnauthorized }) {
  const [tasks, setTasks] = useState([]);
  const [costs, setCosts] = useState([]);
  const [error, setError] = useState('');
  const [project, setProject] = useState('');
  const [search, setSearch] = useState('');
  // null | 'new' | id задачи
  const [view, setView] = useState(null);

  const load = useCallback(
    () =>
      Promise.all([fetchTasks(), fetchCosts()])
        .then(([taskList, costList]) => {
          setTasks(taskList);
          setCosts(costList);
        })
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
  const query = search.trim().toLowerCase();
  const visible = tasks
    .filter((t) => !project || t.project === project)
    .filter((t) => !query || t.title.toLowerCase().includes(query));
  const totalCost = costs.reduce((sum, c) => sum + c.costUsd, 0);

  return (
    <>
      <div className="toolbar">
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">Все проекты</option>
          {projects.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Поиск по названию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setView('new')}>Новая задача</button>
      </div>

      {costs.length > 0 && (
        <p className="cost-summary">
          Всего: <b>{formatUsd(totalCost)}</b>
          {costs.map((c) => (
            <span key={c.project}> · {c.project}: {formatUsd(c.costUsd)}</span>
          ))}
        </p>
      )}

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
              {items.map((t) => {
                const cost = sumRunCosts(t.runs);
                return (
                  <article
                    className="card"
                    key={t._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setView(t._id)}
                    onKeyDown={(e) => e.key === 'Enter' && setView(t._id)}
                  >
                    <strong>
                      {t.priority === 'high' && <span className="prio-high">! </span>}
                      {t.title}
                    </strong>
                    <small>
                      {t.project}
                      {t.dueDate && ` · до ${new Date(t.dueDate).toLocaleDateString('ru-RU')}`}
                      {cost > 0 && <span className="cost-badge"> · {formatUsd(cost)}</span>}
                    </small>
                    {t.priority !== 'normal' && (
                      <small className="muted">Приоритет: {PRIORITY_LABELS[t.priority]}</small>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </>
  );
}
