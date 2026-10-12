import { useCallback, useEffect, useState } from 'react';
import { fetchProjects, deleteProject } from '../api.js';
import { PROJECT_STATUS_LABELS } from '../../../shared/crm.js';
import { formatUsd } from '../lib/cost.js';
import { confirmAction } from '../lib/telegram.js';
import ProjectForm from './ProjectForm.jsx';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // null | 'new' | объект проекта для редактирования
  const [editing, setEditing] = useState(null);

  const load = useCallback(
    () =>
      fetchProjects()
        .then(setProjects)
        .catch((err) => setError(err.message))
        .finally(() => setLoaded(true)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  function saved(message) {
    setEditing(null);
    setNotice(message);
    load();
  }

  async function remove(project) {
    const ok = await confirmAction(`Удалить проект «${project.name}»? Это нельзя отменить.`);
    if (!ok) return;
    setError('');
    try {
      await deleteProject(project._id);
      setEditing(null);
      setNotice(`Проект «${project.name}» удалён`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="toolbar">
        <button onClick={() => { setNotice(''); setEditing('new'); }}>Новый проект</button>
      </div>

      {notice && !editing && <p className="notice">{notice}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {editing && (
        <ProjectForm
          project={editing === 'new' ? null : editing}
          onSaved={() => saved(editing === 'new' ? 'Проект создан' : 'Изменения сохранены')}
          onCancel={() => setEditing(null)}
          onDelete={editing === 'new' ? null : () => remove(editing)}
        />
      )}

      {!loaded && <p className="muted">Загружаем проекты…</p>}
      {loaded && projects.length === 0 && (
        <p className="muted">
          Проектов пока нет. Проект нужен, чтобы создавать задачи: он задаёт slug и папку репозитория.
        </p>
      )}

      <div className="list">
        {projects.map((p) => (
          <article
            key={p._id}
            className="row-card"
            role="button"
            tabIndex={0}
            onClick={() => { setNotice(''); setEditing(p); }}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(p)}
          >
            <div>
              <strong>{p.name}</strong> <span className="muted">{p.slug}</span>
            </div>
            <div className="muted">
              {PROJECT_STATUS_LABELS[p.status]}
              {p.client && ` · клиент ${p.client.name}`}
              {p.deadline && ` · срок ${new Date(p.deadline).toLocaleDateString('ru-RU')}`}
            </div>
            <div className="muted">
              Задач: {p.stats.tasks}, открыто {p.stats.open} · затраты на Claude {formatUsd(p.stats.costUsd)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
