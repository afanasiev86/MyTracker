import mongoose from 'mongoose';
import { TASK_STATUSES } from '../../../shared/statuses.js';
import { PRIORITIES } from '../../../shared/crm.js';
import { TASK_KINDS } from '../../../shared/taskKinds.js';

const runSchema = new mongoose.Schema({
  startedAt: Date,
  finishedAt: Date,
  summary: String,
  costUsd: Number,
  log: String,
}, { _id: false });

const commentSchema = new mongoose.Schema({
  author: { type: String, default: 'owner' },
  text: { type: String, required: true },
  // Виден ли комментарий заказчику в портале (комментарии заказчика — всегда видны)
  visibleToClient: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

// Метаданные вложения (сам файл лежит на диске, см. services/attachments.js)
const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  // Где лежит файл: minio или s3
  provider: { type: String, default: 'minio' },
  name: { type: String, default: 'screenshot' },
  mime: { type: String, required: true },
  size: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  // slug проекта, см. модель Project
  project: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  goal: { type: String, default: '' },
  acceptance: { type: [String], default: [] },
  context: { type: String, default: '' },
  outOfScope: { type: String, default: '' },
  status: { type: String, enum: TASK_STATUSES, default: 'backlog' },
  priority: { type: String, enum: PRIORITIES, default: 'normal' },
  // Тип задачи: выбирает инструкции для Claude (см. skill implement-task)
  kind: { type: String, enum: TASK_KINDS, default: 'other' },
  dueDate: { type: Date, default: null },
  tags: { type: [String], default: [] },
  branch: { type: String, default: '' },
  // Сессия Claude Code, которую продолжаем после ответа на вопрос
  sessionId: { type: String, default: '' },
  // Вопрос, который Claude задал и который ждёт ответа
  pendingQuestion: { type: String, default: '' },
  // Текущий шаг запуска, пока задача в работе (обновляется воркером)
  progress: { type: String, default: '' },
  attachments: { type: [attachmentSchema], default: [] },
  runs: { type: [runSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
}, { timestamps: true });

taskSchema.index({ project: 1, status: 1 });

// Подписчики на смену статуса задачи: (task, fromStatus) => void.
// Сюда подключаются уведомления заказчику (см. services/clientNotify.js).
const statusListeners = [];
export function onTaskStatusChange(listener) {
  statusListeners.push(listener);
}

// Запоминаем статус при загрузке, чтобы после сохранения понять, менялся ли он
taskSchema.post('init', function rememberStatus(doc) {
  doc.$locals.loadedStatus = doc.status;
});

taskSchema.post('save', function notifyStatusChange(doc) {
  const from = doc.$locals.loadedStatus ?? 'backlog';
  if (from === doc.status) return;
  doc.$locals.loadedStatus = doc.status;
  for (const listener of statusListeners) {
    // Ошибка подписчика не должна ломать сохранение задачи
    Promise.resolve()
      .then(() => listener(doc, from))
      .catch((err) => console.error('Подписчик статуса:', err.message));
  }
});

export default mongoose.model('Task', taskSchema);
