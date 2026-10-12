import { TASK_KINDS, KIND_LABELS } from '../../../../shared/taskKinds.js';

// Тип задачи и текстовые поля: цель, критерии, что не трогать, контекст
export default function DetailFields({ form, set }) {
  return (
    <>
      <label>
        Тип задачи
        <select value={form.kind || 'other'} onChange={set('kind')}>
          {TASK_KINDS.map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
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
    </>
  );
}
