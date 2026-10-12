import { TASK_TEMPLATES } from '../../lib/templates.js';

// Шаблон заполняет пустые поля формы. Выбор сбрасывается сразу, чтобы можно было взять тот же шаблон снова.
export default function TemplatePicker({ onPick }) {
  return (
    <label>
      Шаблон (заполнит пустые поля)
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) onPick(e.target.value);
          e.target.value = '';
        }}
      >
        <option value="">Без шаблона</option>
        {Object.entries(TASK_TEMPLATES).map(([key, t]) => <option key={key} value={key}>{t.label}</option>)}
      </select>
    </label>
  );
}
