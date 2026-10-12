// Сводка по запускам Claude: в работе, ждут ответа, зависшие
export default function RunsSummary({ sessions, worker }) {
  return (
    <p className="muted">
      Запуски Claude: в работе {sessions.inProgress}, ждут ответа {sessions.waitingForAnswer},
      процессов сейчас {worker.runningProcesses}.
      {sessions.stale > 0 && ` Без процесса (зависли): ${sessions.stale}.`}
    </p>
  );
}
