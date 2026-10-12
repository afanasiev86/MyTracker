// Текущий шаг Claude, пока задача в работе
export default function ProgressBlock({ task }) {
  return (
    <section className="progress" aria-label="Ход запуска">
      <p className="question-label">Claude работает</p>
      <p>{task.progress || 'Запуск…'}</p>
    </section>
  );
}
