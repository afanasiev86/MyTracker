import { useEffect, useState } from 'react';
import { fetchHealthDetails } from '../api.js';

const REFRESH_MS = 30 * 1000;

const CHECK_LABELS = {
  mongo: 'База данных',
  claude: 'Claude Code',
  storage: 'Хранилище вложений',
  telegram: 'Telegram',
};

function formatUptime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
}

// Состояние сервисов и запусков Claude. Видно только владельцу, обновляется каждые 30 секунд.
export default function Health() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetchHealthDetails()
      .then((d) => { setData(d); setError(''); })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  if (!data) {
    return (
      <section className="panel">
        <h2>Состояние</h2>
        <p className="muted">{error || 'Загрузка…'}</p>
      </section>
    );
  }

  const { checks, worker, sessions, process: proc } = data;

  return (
    <section className="panel" aria-label="Состояние сервисов">
      <header className="panel-head">
        <h2>Состояние</h2>
        <button className="ghost" onClick={load}>Обновить</button>
      </header>
      <ul>
        {Object.entries(CHECK_LABELS).map(([key, label]) => (
          <li key={key}>
            {label}: <b>{checks[key].ok ? 'в норме' : 'проблема'}</b>
            {checks[key].error && <span className="muted"> — {checks[key].error}</span>}
          </li>
        ))}
      </ul>
      <p className="muted">
        Запуски Claude: в работе {sessions.inProgress}, ждут ответа {sessions.waitingForAnswer},
        процессов сейчас {worker.runningProcesses}.
        {sessions.stale > 0 && ` Без процесса (зависли): ${sessions.stale}.`}
      </p>
      <p className="muted">
        Сервер работает {formatUptime(proc.uptimeSec)}, памяти {proc.rssMb} МБ.
      </p>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
