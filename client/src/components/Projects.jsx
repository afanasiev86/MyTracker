import { useCallback, useEffect, useState } from 'react';
import { fetchProjects, deleteProject } from '../api.js';
import { PROJECT_STATUS_LABELS } from '../../../shared/crm.js';
import { formatUsd } from '../lib/cost.js';
import ProjectForm from './ProjectForm.jsx';

export default function Projects({ onUnauthorized }) {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  // null | 'new' | объект проекта для редактирования
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    () =>
      fetchProjects()
        .then(setProjects)
        .catch((err) => {
          if (err.status === 401) return onUnauthorized();
          return setError(err.message);
        }),
    [onUnauthorized],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function remove(project) {
    if (!window.confirm(`Удалить проект «${project.name}»?`)) return;
    setError('');
    try {
      await deleteProject(project._id);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button onClick={() => setEditing('new')}>Новый проект</button>
      </div>

      {error && <p className="error">{error}</p>}

      {editing && (
        <ProjectForm
          project={editing === 'new' ? null : editing}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
          onDelete={editing === 'new' ? null : () => remove(editing)}
        />
      )}

      {projects.length === 0 && <p className="muted">Проектов пока нет. Создайте первый.</p>}

      <div className="list">
        {projects.map((p) => (
          <article
            key={p._id}
            className="row-card"
            role="button"
            tabIndex={0}
            onClick={() => setEditing(p)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(p)}
          >
            <div>
              <strong>{p.name}</strong> <span className="muted">{p.slug}</span>
            </div>
            <div className="muted">
              {PROJECT_STATUS_LABELS[p.status]}
              {p.client && ` · ${p.client.name}`}
              {p.deadline && ` · до ${new Date(p.deadline).toLocaleDateString('ru-RU')}`}
            </div>
            <div className="muted">
              Задач: {p.stats.tasks} (открыто {p.stats.open}) · затраты {formatUsd(p.stats.costUsd)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
