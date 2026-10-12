import { sumRunCosts, formatUsd } from '../../lib/cost.js';

// История запусков и суммарная стоимость задачи
export default function RunsSection({ runs }) {
  return (
    <>
      <h3>Запуски</h3>
      {runs.length === 0 ? (
        <p className="muted">Запусков пока не было. Они появятся после запуска в Claude.</p>
      ) : (
        <>
          <p className="muted">Стоимость задачи: <b>{formatUsd(sumRunCosts(runs))}</b></p>
          <ul>
            {runs.map((run, i) => (
              <li key={i}>
                {new Date(run.startedAt).toLocaleString('ru-RU')}: {run.summary?.slice(0, 300)}
                {run.costUsd != null && ` (${formatUsd(run.costUsd)})`}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
