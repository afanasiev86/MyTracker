import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import Task from './models/Task.js';
import { startPolling } from './bot/poller.js';
import { handleCommand } from './bot/commands.js';

const { PORT = 3001, MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.error('MONGO_URL не задан. См. server/.env.example');
  process.exit(1);
}

await mongoose.connect(MONGO_URL);

// Задачи, которые были в работе при остановке сервера, помечаем как ошибку
await Task.updateMany(
  { status: 'in_progress' },
  {
    $set: { status: 'failed' },
    $push: { comments: { author: 'system', text: 'Сервер перезапущен во время работы. Запустите задачу заново.' } },
  },
);

createApp().listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
});

void startPolling(handleCommand);
