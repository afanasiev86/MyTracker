import { Input, Select } from 'antd';
import { TASK_KINDS, KIND_LABELS } from '../../../../shared/taskKinds.js';
import Field from '../Field.jsx';

// Тип задачи и текстовые поля: цель, критерии, что не трогать, контекст
export default function DetailFields({ form, set }) {
  return (
    <>
      <Field label="Тип задачи">
        <Select
          value={form.kind || 'other'}
          onChange={set('kind')}
          options={TASK_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))}
        />
      </Field>
      <Field label="Цель">
        <Input.TextArea value={form.goal} onChange={set('goal')} rows={2} />
      </Field>
      <Field label="Критерии приёмки (по одному в строке)">
        <Input.TextArea value={form.acceptance} onChange={set('acceptance')} rows={4} />
      </Field>
      <Field label="Что не трогать">
        <Input.TextArea value={form.outOfScope} onChange={set('outOfScope')} rows={2} />
      </Field>
      <Field label="Контекст (ссылки, эндпоинты, макеты)">
        <Input.TextArea value={form.context} onChange={set('context')} rows={2} />
      </Field>
    </>
  );
}
