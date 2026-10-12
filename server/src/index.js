import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { onTaskStatusChange } from './models/Task.js';
import { notifyClientOfStatusChange } from './services/clientNotify.js';
import { startPolling } from './bot/poller.js';
import { handleCommand } from './bot/commands.js';
import { handleCallback } from './bot/callbacks.js';
import { handleGuest } from './bot/guest.js';
import { startDigestScheduler } from './services/digestScheduler.js';
import { recoverRuns } from './services/runs.js';
import { getConfig, assertStartupConfig } from './config.js';

const cfg = getConfig();
try {
  for (const warning of assertStartupConfig(cfg)) console.warn(`Предупреждение: ${warning}`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

await mongoose.connect(cfg.mongoUrl);

// Запуски, которые были в работе при остановке: ждавшие в очереди ставим обратно, выполнявшиеся помечаем ошибкой
const recovered = await recoverRuns();
console.log(`Восстановлено запусков: в очередь ${recovered.resumed}, с ошибкой ${recovered.failed}`);

createApp().listen(cfg.port, () => {
  console.log(`API запущен на порту ${cfg.port}`);
});

void startPolling(handleCommand, handleCallback, handleGuest);
startDigestScheduler();
onTaskStatusChange(notifyClientOfStatusChange);
