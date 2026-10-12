import { useEffect, useState } from 'react';
import {
  getTask,
  updateTask,
  addComment,
  runTask,
  fetchDiff,
} from '../api.js';
import {
  STATUS_LABELS,
  RUNNABLE_FROM,
  allowedTargets,
} from '../../../shared/statuses.js';
import { sumRunCosts, formatUsd } from '../lib/cost.js';

export default function TaskDetail({ id, onChanged, onClose }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState('');
  const [comment, setComment] = useState('');

  const load = () => getTask(id).then(setTask).catch((err) => setError(err.message));

  useEffect(() => {
    setDiff('');
    setError('');
    getTask(id).then(setTask).catch((err) => setError(err.message));
  }, [id]);

  async function perform(action) {
    setError('');
    try {
      await action();
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!task) {
    return <section className="panel">{error || 'Загрузка…'}</section>;
  }

  const targets = allowedTargets(task.status);
  const canRun = RUNNABLE_FROM.includes(task.status);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{task.title}</h2>
        <button className="ghost" onClick={onClose}>Закрыть</button>
      </header>
      <p className="muted">{task.project} · {STATUS_LABELS[task.status]}</p>

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

      <div className="actions">
        {canRun && (
          <button onClick={() => perform(() => runTask(id))}>
            {task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude'}
          </button>
        )}
        {targets.map((status) => (
          <button
            key={status}
            className="ghost"
            onClick={() => perform(() => updateTask(id, { status }))}
          >
            → {STATUS_LABELS[status]}
          </button>
        ))}
        {task.branch && (
          <button
            className="ghost"
            onClick={async () => {
              setError('');
              try {
                setDiff(await fetchDiff(id));
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            Показать diff
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {diff && <pre className="diff">{diff}</pre>}

      <h3>Запуски</h3>
      {task.runs.length > 0 && (
        <p className="muted">Стоимость задачи: <b>{formatUsd(sumRunCosts(task.runs))}</b></p>
      )}
      {task.runs.length === 0 ? (
        <p className="muted">Запусков пока не было.</p>
      ) : (
        <ul>
          {task.runs.map((run, i) => (
            <li key={i}>
              {new Date(run.startedAt).toLocaleString('ru-RU')}: {run.summary?.slice(0, 300)}
              {run.costUsd != null && ` ($${run.costUsd.toFixed(3)})`}
            </li>
          ))}
        </ul>
      )}

      <h3>Комментарии</h3>
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
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Комментарий или доработка"
        />
        <button type="submit" disabled={!comment.trim()}>Добавить</button>
      </form>
    </section>
  );
}
