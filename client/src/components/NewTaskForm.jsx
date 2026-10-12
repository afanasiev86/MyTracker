import { useState } from 'react';
import { createTask } from '../api.js';
import { applyTemplate } from '../lib/templates.js';
import { EMPTY_TASK_FORM } from './newTask/emptyForm.js';
import { buildTaskBody } from './newTask/buildTaskBody.js';
import { useProjects } from './newTask/useProjects.js';
import ProjectField from './newTask/ProjectField.jsx';
import BasicFields from './newTask/BasicFields.jsx';
import TemplatePicker from './newTask/TemplatePicker.jsx';
import DetailFields from './newTask/DetailFields.jsx';

export default function NewTaskForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(EMPTY_TASK_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const projects = useProjects(setForm, setError);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const task = await createTask(buildTaskBody(form));
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

      <ProjectField
        projects={projects}
        value={form.project}
        onChange={set('project')}
      />

      <BasicFields form={form} set={set} />

      <TemplatePicker onPick={(key) => setForm((f) => applyTemplate(f, key))} />

      <DetailFields form={form} set={set} />

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
