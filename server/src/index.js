import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import Task, { onTaskStatusChange } from './models/Task.js';
import { notifyClientOfStatusChange } from './services/clientNotify.js';
import { startPolling } from './bot/poller.js';
import { handleCommand } from './bot/commands.js';
import { handleCallback } from './bot/callbacks.js';
import { handleGuest } from './bot/guest.js';
import { startDigestScheduler } from './services/digestScheduler.js';
import { getConfig, assertStartupConfig } from './config.js';

const cfg = getConfig();
try {
  for (const warning of assertStartupConfig(cfg)) console.warn(`Предупреждение: ${warning}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

await mongoose.connect(cfg.mongoUrl);

// Задачи, которые были в работе при остановке сервера, помечаем как ошибку
await Task.updateMany(
  { status: 'in_progress' },
  {
    $set: { status: 'failed' },
    $push: { comments: { author: 'system', text: 'Сервер перезапущен во время работы. Запустите задачу заново.' } },
  },
);

createApp().listen(cfg.port, () => {
  console.log(`API запущен на порту ${cfg.port}`);
});

void startPolling(handleCommand, handleCallback, handleGuest);
startDigestScheduler();
onTaskStatusChange(notifyClientOfStatusChange);
