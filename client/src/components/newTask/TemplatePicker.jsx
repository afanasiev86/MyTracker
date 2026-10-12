import { Select } from 'antd';
import { TASK_TEMPLATES } from '../../lib/templates/catalog.js';
import Field from '../Field.jsx';

// Шаблон заполняет пустые поля формы. Значение всегда пустое, чтобы можно было взять тот же шаблон снова.
export default function TemplatePicker({ onPick }) {
  return (
    <Field label="Шаблон (заполнит пустые поля)">
      <Select
        value={null}
        placeholder="Без шаблона"
        onChange={onPick}
        options={Object.entries(TASK_TEMPLATES).map(([key, t]) => ({ value: key, label: t.label }))}
      />
    </Field>
  );
}
