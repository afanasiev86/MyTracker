import { useEffect, useState } from 'react';
import { createTask, fetchProjects } from '../api.js';
import { PRIORITIES, PRIORITY_LABELS } from '../../../shared/crm.js';
import { TASK_TEMPLATES, applyTemplate } from '../lib/templates.js';

const EMPTY = {
  project: '', title: '', goal: '', acceptance: '', outOfScope: '',
  context: '', priority: 'normal', dueDate: '',
};

export default function NewTaskForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProjects()
      .then((list) => {
        setProjects(list);
        const active = list.find((p) => p.status === 'active');
        if (active) setForm((f) => ({ ...f, project: f.project || active.slug }));
      })
      .catch((err) => setError(err.message));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const task = await createTask({
        project: form.project,
        title: form.title.trim(),
        goal: form.goal.trim(),
        acceptance: form.acceptance.split('\n').map((s) => s.trim()).filter(Boolean),
        outOfScope: form.outOfScope.trim(),
        context: form.context.trim(),
        priority: form.priority,
        dueDate: form.dueDate || null,
      });
      onCreated(task);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Новая задача</h2>

      {projects.length === 0 ? (
        <p className="muted">Сначала создайте проект на вкладке «Проекты».</p>
      ) : (
        <label>
          Проект
          <select value={form.project} onChange={set('project')} required>
            {projects.map((p) => (
              <option key={p._id} value={p.slug}>{p.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="grid-2">
        <label>
          Заголовок
          <input value={form.title} onChange={set('title')} required />
        </label>
        <label>
          Приоритет
          <select value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
        </label>
        <label>
          Срок
          <input type="date" value={form.dueDate} onChange={set('dueDate')} />
        </label>
      </div>

      <label>
        Шаблон (заполнит пустые поля)
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) setForm((f) => applyTemplate(f, e.target.value));
            e.target.value = '';
          }}
        >
          <option value="">Без шаблона</option>
          {Object.entries(TASK_TEMPLATES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
        </select>
      </label>
      <label>
        Цель
        <textarea value={form.goal} onChange={set('goal')} rows={2} />
      </label>
      <label>
        Критерии приёмки (по одному в строке)
        <textarea value={form.acceptance} onChange={set('acceptance')} rows={4} />
      </label>
      <label>
        Что не трогать
        <textarea value={form.outOfScope} onChange={set('outOfScope')} rows={2} />
      </label>
      <label>
        Контекст (ссылки, эндпоинты, макеты)
        <textarea value={form.context} onChange={set('context')} rows={2} />
      </label>

      <div className="actions">
        <button
          type="submit"
          disabled={busy || !form.project || !form.title.trim()}
        >
          Создать
        </button>
        <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
