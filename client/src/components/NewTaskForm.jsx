import { useState } from 'react';
import { createTask } from '../api.js';

const EMPTY = { project: '', title: '', goal: '', acceptance: '', outOfScope: '', context: '' };

export default function NewTaskForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const task = await createTask({
        project: form.project.trim(),
        title: form.title.trim(),
        goal: form.goal.trim(),
        acceptance: form.acceptance.split('\n').map((s) => s.trim()).filter(Boolean),
        outOfScope: form.outOfScope.trim(),
        context: form.context.trim(),
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
      <label>
        Проект
        <input value={form.project} onChange={set('project')} placeholder="shop" required />
      </label>
      <label>
        Заголовок
        <input value={form.title} onChange={set('title')} required />
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
        <button type="submit" disabled={busy || !form.project.trim() || !form.title.trim()}>
          Создать
        </button>
        <button type="button" className="ghost" onClick={onCancel}>Отмена</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
