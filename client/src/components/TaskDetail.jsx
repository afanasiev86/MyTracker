import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Tabs } from 'antd';
import {
  getTask,
  updateTask,
  addComment,
  runTask,
  answerTask,
  fixTask,
  cancelTask,
  fetchDiff,
  uploadAttachment,
} from '../api.js';
import { RUNNABLE_FROM } from '../../../shared/statuses.js';
import { setMainButton } from '../lib/telegram/mainButton.js';
import { haptic } from '../lib/telegram/haptic.js';
import { mainLabel } from '../lib/mainButton.js';
import TaskSpec from './task/TaskSpec.jsx';
import ProgressBlock from './task/ProgressBlock.jsx';
import QuestionBlock from './task/QuestionBlock.jsx';
import FailureBlock from './task/FailureBlock.jsx';
import StandBlock from './task/StandBlock.jsx';
import TaskHeader from './task/TaskHeader.jsx';
import TaskSidebar from './task/TaskSidebar.jsx';
import DiffView from './task/DiffView.jsx';
import AttachmentsSection from './task/AttachmentsSection.jsx';
import RunsSection from './task/RunsSection.jsx';
import CommentsSection from './task/CommentsSection.jsx';
import Loading from './Loading.jsx';

const PROGRESS_POLL_MS = 4000;

// Карточка задачи: состояние и действия. Отдельные блоки лежат в components/task/.
export default function TaskDetail({ id, onChanged }) {
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

  // Пока задача в работе или собирается стенд, подгружаем состояние
  const inProgress = task?.status === 'in_progress' || task?.stand?.status === 'building';
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
    return error ? <Alert type="error" showIcon message={error} /> : <Loading text="Загрузка…" />;
  }

  // Ответ и комментарий: возвращают true при успехе, чтобы блок очистил поле
  const answerAndReload = (text) => perform(() => answerTask(id, text));
  const fixAndReload = (text) => perform(() => fixTask(id, text));
  const addCommentAndReload = (text, visible) => perform(() => addComment(id, text, visible));

  const withCount = (label, count) => (
    <span>{label} {count > 0 && <Badge count={count} color="#8c8c8c" size="small" />}</span>
  );
  const tabs = [
    {
      key: 'comments',
      label: withCount('Комментарии', task.comments.length),
      children: <CommentsSection comments={task.comments} busy={busy} onAdd={addCommentAndReload} />,
    },
    { key: 'runs', label: withCount('Запуски', task.runs.length), children: <RunsSection runs={task.runs} /> },
    {
      key: 'files',
      label: withCount('Скриншоты', task.attachments?.length ?? 0),
      children: (
        <AttachmentsSection
          taskId={id}
          attachments={task.attachments}
          busy={busy}
          onUpload={(file) => perform(() => uploadAttachment(id, file))}
        />
      ),
    },
  ];

  return (
    <div aria-live="polite">
      <TaskHeader task={task} />

      <div className="task-layout">
        <TaskSidebar
          task={task}
          actionProps={{
            busy,
            diffShown: diff !== null,
            onCancel: () => perform(() => cancelTask(id)),
            onRun: () => perform(() => runTask(id)),
            onTransition: (status) => perform(() => updateTask(id, { status })),
            onToggleDiff: toggleDiff,
          }}
        />

        <div className="task-main">
          {task.status === 'in_progress' && <ProgressBlock task={task} />}
          {task.status === 'waiting' && <QuestionBlock task={task} busy={busy} onAnswer={answerAndReload} />}
          {task.status === 'failed' && <FailureBlock task={task} busy={busy} onFix={fixAndReload} />}
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <StandBlock stand={task.stand} />

          <TaskSpec task={task} />
          {diff !== null && <DiffView diff={diff} />}

          <Tabs defaultActiveKey="comments" items={tabs} />
        </div>
      </div>
    </div>
  );
}
