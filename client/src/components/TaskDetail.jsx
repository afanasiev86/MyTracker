import { useEffect, useRef, useState } from 'react';
import {
  getTask,
  updateTask,
  addComment,
  runTask,
  answerTask,
  cancelTask,
  fetchDiff,
  uploadAttachment,
} from '../api.js';
import { RUNNABLE_FROM, STATUS_LABELS } from '../../../shared/statuses.js';
import { KIND_LABELS } from '../../../shared/taskKinds.js';
import { setMainButton, haptic } from '../lib/telegram.js';
import { mainLabel } from '../lib/mainButton.js';
import TaskSpec from './task/TaskSpec.jsx';
import ProgressBlock from './task/ProgressBlock.jsx';
import QuestionBlock from './task/QuestionBlock.jsx';
import ActionBar from './task/ActionBar.jsx';
import DiffView from './task/DiffView.jsx';
import AttachmentsSection from './task/AttachmentsSection.jsx';
import RunsSection from './task/RunsSection.jsx';
import CommentsSection from './task/CommentsSection.jsx';

const PROGRESS_POLL_MS = 4000;

// Карточка задачи: состояние и действия. Отдельные блоки лежат в components/task/.
export default function TaskDetail({ id, onChanged, onClose }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [diff, setDiff] = useState(null);
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

  // Любое действие: блокируем кнопки, при успехе перечитываем задачу и сообщаем списку.
  // Возвращает true, если действие прошло.
  async function perform(action) {
    setError('');
    setBusy(true);
    try {
      await action();
      haptic('success');
      await reload();
      onChanged();
      return true;
    } catch (err) {
      haptic('error');
      setError(err.message);
      return false;
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

  // Ответ и комментарий: возвращают true при успехе, чтобы блок очистил поле
  const answerAndReload = (text) => perform(() => answerTask(id, text));
  const addCommentAndReload = (text, visible) => perform(() => addComment(id, text, visible));

  return (
    <section className="panel" aria-live="polite">
      <header className="panel-head">
        <div>
          <h2>{task.title}</h2>
          <p className="muted">{task.project} · {STATUS_LABELS[task.status]} · {KIND_LABELS[task.kind] ?? KIND_LABELS.other}</p>
        </div>
        <button className="ghost" onClick={onClose}>Закрыть</button>
      </header>

      <TaskSpec task={task} />
      {task.status === 'in_progress' && <ProgressBlock task={task} />}
      {task.status === 'waiting' && <QuestionBlock task={task} busy={busy} onAnswer={answerAndReload} />}

      <ActionBar
        task={task}
        busy={busy}
        diffShown={diff !== null}
        onCancel={() => perform(() => cancelTask(id))}
        onRun={() => perform(() => runTask(id))}
        onTransition={(status) => perform(() => updateTask(id, { status }))}
        onToggleDiff={toggleDiff}
      />

      {error && <p className="error" role="alert">{error}</p>}
      {diff !== null && <DiffView diff={diff} />}

      <AttachmentsSection
        taskId={id}
        attachments={task.attachments}
        busy={busy}
        onUpload={(file) => perform(() => uploadAttachment(id, file))}
      />
      <RunsSection runs={task.runs} />
      <CommentsSection comments={task.comments} busy={busy} onAdd={addCommentAndReload} />
    </section>
  );
}
