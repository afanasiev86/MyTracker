import { useEffect, useState } from 'react';
import {
  getTask,
  updateTask,
  addComment,
  runTask,
  answerTask,
  cancelTask,
  fetchDiff,
} from '../api.js';
import {
  STATUS_LABELS,
  RUNNABLE_FROM,
  allowedTargets,
} from '../../../shared/statuses.js';
import { sumRunCosts, formatUsd } from '../lib/cost.js';

// Подписи действий описывают, что произойдёт, а не новый статус
const ACTION_LABELS = {
  ready: 'Отдать в работу',
  backlog: 'Вернуть в бэклог',
  done: 'Принять результат',
};

export default function TaskDetail({ id, onChanged, onClose }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState(null);
  const [comment, setComment] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = () => getTask(id).then(setTask).catch((err) => setError(err.message));

  useEffect(() => {
    setDiff(null);
    setError('');
    getTask(id).then(setTask).catch((err) => setError(err.message));
  }, [id]);

  async function perform(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      await reload();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleDiff() {
    if (diff !== null) return setDiff(null);
    setError('');
    try {
      setDiff(await fetchDiff(id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!task) {
    return <section className="panel">{error || 'Загрузка…'}</section>;
  }

  const targets = allowedTargets(task.status);
  const canRun = RUNNABLE_FROM.includes(task.status);
  const runLabel = task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude';

  return (
    <section className="panel" aria-live="polite">
      <header className="panel-head">
        <div>
          <h2>{task.title}</h2>
          <p className="muted">{task.project} · {STATUS_LABELS[task.status]}</p>
        </div>
        <button className="ghost" onClick={onClose}>Закрыть</button>
      </header>

      {task.goal && <p><b>Цель:</b> {task.goal}</p>}
      {task.acceptance.length > 0 && (
        <>
          <b>Критерии приёмки:</b>
          <ul>
            {task.acceptance.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </>
      )}
      {task.outOfScope && <p><b>Не трогать:</b> {task.outOfScope}</p>}
      {task.context && <p><b>Контекст:</b> {task.context}</p>}

      {task.status === 'waiting' && (
        <section className="question" aria-label="Вопрос Claude">
          <p className="question-label">Claude спрашивает</p>
          <p>{task.pendingQuestion || 'Вопрос не сохранён, посмотрите комментарии и последний запуск.'}</p>
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!answer.trim()) return;
              perform(async () => {
                await answerTask(id, answer.trim());
                setAnswer('');
              });
            }}
          >
            <label className="full">
              Ваш ответ
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} />
            </label>
            <button type="submit" disabled={busy || !answer.trim()}>Ответить и продолжить</button>
          </form>
        </section>
      )}

      <div className="actions">
        {task.status === 'in_progress' && (
          <button className="danger" disabled={busy} onClick={() => perform(() => cancelTask(id))}>
            Отменить запуск
          </button>
        )}
        {canRun && (
          <button disabled={busy} onClick={() => perform(() => runTask(id))}>
            {runLabel}
          </button>
        )}
        {targets.map((status) => (
          <button
            key={status}
            className="ghost"
            disabled={busy}
            onClick={() => perform(() => updateTask(id, { status }))}
          >
            {ACTION_LABELS[status] || STATUS_LABELS[status]}
          </button>
        ))}
        {task.branch && (
          <button className="ghost" onClick={toggleDiff}>
            {diff === null ? 'Показать diff' : 'Скрыть diff'}
          </button>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {diff !== null && (
        diff.trim()
          ? <pre className="diff">{diff}</pre>
          : <p className="muted">В ветке пока нет изменений относительно основной.</p>
      )}

      <h3>Запуски</h3>
      {task.runs.length === 0 ? (
        <p className="muted">Запусков пока не было. Они появятся после запуска в Claude.</p>
      ) : (
        <>
          <p className="muted">Стоимость задачи: <b>{formatUsd(sumRunCosts(task.runs))}</b></p>
          <ul>
            {task.runs.map((run, i) => (
              <li key={i}>
                {new Date(run.startedAt).toLocaleString('ru-RU')}: {run.summary?.slice(0, 300)}
                {run.costUsd != null && ` (${formatUsd(run.costUsd)})`}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Комментарии</h3>
      {task.comments.length === 0 && (
        <p className="muted">Комментариев нет. Claude читает их при следующем запуске, поэтому здесь можно написать доработку.</p>
      )}
      {task.comments.length > 0 && (
        <ul>
          {task.comments.map((c, i) => <li key={i}>{c.text}</li>)}
        </ul>
      )}
      <form
        className="comment-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!comment.trim()) return;
          perform(async () => {
            await addComment(id, comment.trim());
            setComment('');
          });
        }}
      >
        <label className="full">
          Новый комментарий
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Что исправить или уточнить"
          />
        </label>
        <button type="submit" disabled={busy || !comment.trim()}>Добавить комментарий</button>
      </form>
    </section>
  );
}
