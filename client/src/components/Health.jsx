import { useHealthDetails } from './health/useHealthDetails.js';
import ChecksList from './health/ChecksList.jsx';
import RunsSummary from './health/RunsSummary.jsx';
import ProcessLine from './health/ProcessLine.jsx';

// Состояние сервисов и запусков Claude. Видно только владельцу, обновляется каждые 30 секунд.
export default function Health() {
  const { data, error, load } = useHealthDetails();

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
      <ChecksList checks={checks} />
      <RunsSummary sessions={sessions} worker={worker} />
      <ProcessLine proc={proc} />
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
