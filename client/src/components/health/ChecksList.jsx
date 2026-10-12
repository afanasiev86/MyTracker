import { CHECK_LABELS } from './constants.js';

// Список проверок сервисов: в норме или проблема с текстом ошибки
export default function ChecksList({ checks }) {
  return (
    <ul>
      {Object.entries(CHECK_LABELS).map(([key, label]) => (
        <li key={key}>
          {label}: <b>{checks[key].ok ? 'в норме' : 'проблема'}</b>
          {checks[key].error && <span className="muted"> — {checks[key].error}</span>}
        </li>
      ))}
    </ul>
  );
}
