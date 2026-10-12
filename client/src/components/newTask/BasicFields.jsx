import { PRIORITIES, PRIORITY_LABELS } from '../../../../shared/crm.js';

// Заголовок, приоритет и срок
export default function BasicFields({ form, set }) {
  return (
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
  );
}
