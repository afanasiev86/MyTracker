import { useEffect, useRef, useState } from 'react';
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
import { setMainButton, haptic } from '../lib/telegram.js';
import { uploadAttachment, fetchAttachmentUrl } from '../api.js';

// Подписи действий описывают, что произойдёт, а не новый статус
const ACTION_LABELS = {
  ready: 'Отдать в работу',
  backlog: 'Вернуть в бэклог',
  done: 'Принять результат',
};

const PROGRESS_POLL_MS = 4000;

// Миниатюра вложения. Картинка грузится с токеном и освобождается при уходе со страницы.
function AttachmentThumb({ taskId, attachment }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let url = '';
    let alive = true;
    fetchAttachmentUrl(taskId, attachment._id)
      .then((objectUrl) => {
        url = objectUrl;
        if (alive) setSrc(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [taskId, attachment._id]);
  return src
    ? <a href={src} target="_blank" rel="noreferrer"><img className="thumb" src={src} alt={attachment.name} /></a>
    : <span className="muted">{attachment.name}</span>;
}

// Главная кнопка Telegram: одно самое полезное действие для текущего статуса
function mainLabel(task) {
  if (RUNNABLE_FROM.includes(task.status)) {
    return task.status === 'review' ? 'Вернуть в работу' : 'Запустить в Claude';
  }
  if (task.status === 'review') return 'Принять результат';
  return '';
}

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

  // Главная кнопка Telegram. Обработчик берём из ref, чтобы он всегда видел свежее состояние
  const mainText = task && !busy ? mainLabel(task) : '';
  const onMainRef = useRef(null);
  onMainRef.current = () => {
    if (!task) return;
    if (RUNNABLE_FROM.includes(task.status)) perform(() => runTask(id));
    else if (task.status === 'review') perform(() => updateTask(id, { status: 'done' }));
  };
  useEffect(() => {
    if (!mainText) return undefined;
    return setMainButton(mainText, () => onMainRef.current());
  }, [mainText]);

  // Пока задача в работе, подгружаем текущий шаг Claude
  const inProgress = task?.status === 'in_progress';
  useEffect(() => {
    if (!inProgress) return undefined;
    const timer = setInterval(() => {
      getTask(id).then(setTask).catch(() => {});
    }, PROGRESS_POLL_MS);
    return () => clearInterval(timer);
  }, [id, inProgress]);

  async function perform(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      haptic('success');
      await reload();
      onChanged();
    } catch (err) {
      haptic('error');
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

      {task.status === 'in_progress' && (
        <section className="progress" aria-label="Ход запуска">
          <p className="question-label">Claude работает</p>
          <p>{task.progress || 'Запуск…'}</p>
        </section>
      )}

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

      <h3>Скриншоты</h3>
      {task.attachments?.length > 0 && (
        <div className="thumbs">
          {task.attachments.map((a) => <AttachmentThumb key={a._id} taskId={id} attachment={a} />)}
        </div>
      )}
      <label className="upload">
        Прикрепить картинку (PNG, JPEG, GIF, WebP до 5 МБ)
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) perform(() => uploadAttachment(id, file));
          }}
        />
      </label>

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
