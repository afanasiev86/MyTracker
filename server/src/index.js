import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { onTaskStatusChange } from './models/Task.js';
import { notifyClientOfStatusChange } from './services/notify/client.js';
import { registerBotHandlers, restartBot } from './bot/poller/botRunner.js';
import { loadTelegramSettings } from './services/telegram/runtime.js';
import { loadGithubSettings } from './services/github/index.js';
import { telegramEnabled } from './services/telegram/api.js';
import { startOpsMonitor } from './services/ops/monitor.js';
import { reportPendingNotice } from './services/ops/notice.js';
import { resumeDeployReporting } from './services/ops/deploy.js';
import { handleCommand } from './bot/commands/handleCommand.js';
import { handleCallback } from './bot/callbacks/handleCallback.js';
import { handleGuest } from './bot/guest.js';
import { startDigestScheduler } from './services/digestScheduler/startDigestScheduler.js';
import { recoverRuns } from './services/runs/recoverRuns.js';
import { getConfig, assertStartupConfig } from './config.js';

const cfg = getConfig();
let warnings;
try {
  warnings = assertStartupConfig(cfg);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

await mongoose.connect(cfg.mongoUrl);
await loadTelegramSettings();
await loadGithubSettings();
// Предупреждение про Telegram не нужно, если бот задан в настройках интерфейса
for (const warning of warnings) {
  if (!(warning.startsWith('TELEGRAM_BOT_TOKEN') && telegramEnabled())) console.warn(`Предупреждение: ${warning}`);
}

// Запуски, которые были в работе при остановке: ждавшие в очереди ставим обратно, выполнявшиеся помечаем ошибкой
const recovered = await recoverRuns();
console.log(`Восстановлено запусков: в очередь ${recovered.resumed}, с ошибкой ${recovered.failed}`);

createApp().listen(cfg.port, () => {
  console.log(`API запущен на порту ${cfg.port}`);
});

registerBotHandlers({ handle: handleCommand, onCallback: handleCallback, onGuest: handleGuest });
restartBot();
startDigestScheduler();
startOpsMonitor();
void reportPendingNotice();
void resumeDeployReporting();
onTaskStatusChange(notifyClientOfStatusChange);
