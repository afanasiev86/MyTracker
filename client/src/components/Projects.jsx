import { useState } from 'react';
import { deleteProject } from '../api.js';
import { confirmAction } from '../lib/telegram/confirm.js';
import ProjectForm from './ProjectForm.jsx';
import ProjectCard from './projects/ProjectCard.jsx';
import { useProjectList } from './projects/useProjectList.js';

export default function Projects() {
  const { projects, loaded, error, setError, load } = useProjectList();
  const [notice, setNotice] = useState('');
  // null | 'new' | объект проекта для редактирования
  const [editing, setEditing] = useState(null);

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
          <ProjectCard
            key={p._id}
            project={p}
            onOpen={(project) => { setNotice(''); setEditing(project); }}
          />
        ))}
      </div>
    </>
  );
}
