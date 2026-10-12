import { domainError } from '../errors.js';
import { telegramEnabled } from './api.js';
import { sendTelegram } from './send.js';
import { clearTelegramSettings, getTelegramConfig, saveTelegramSettings } from './runtime.js';
import { restartBot } from '../../bot/poller/botRunner.js';
import { setMenuButton } from '../../bot/poller/setMenuButton.js';

// Имя бота по токену: заодно проверяет, что токен настоящий
async function fetchBotUsername(token) {
  let data;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    data = await res.json();
  } catch {
    throw domainError('unavailable', 'Не удалось связаться с Telegram. Проверьте интернет и повторите.');
  }
  if (!data?.ok) {
    throw domainError('invalid', 'Telegram не принял токен. Скопируйте его из @BotFather целиком.');
  }
  return data.result.username;
}

// Подключение бота из настроек. Пустой токен означает «оставить действующий».
// Возвращает ownerReachable: false, если бот не смог написать владельцу (обычно не нажата кнопка Start у бота).
export async function connectTelegram({ botToken, ownerId, miniAppUrl }) {
  const before = getTelegramConfig();
  const token = botToken || before.botToken;
  if (!token) throw domainError('invalid', 'Укажите токен бота');

  const botUsername = await fetchBotUsername(token);
  const wasEnabled = telegramEnabled();
  await saveTelegramSettings({ botToken: token, ownerId, miniAppUrl: miniAppUrl || '', botUsername });

  // Новый токен или бот был выключен: запускаем цикл заново. Иначе достаточно обновить кнопку меню.
  if (!wasEnabled || token !== before.botToken) restartBot();
  else await setMenuButton();

  const ownerReachable = await sendTelegram(`MyTracker подключён к боту @${botUsername}. Команда /status покажет активные задачи.`)
    .then(() => true, () => false);
  return { ownerReachable };
}

// Отключение: убирает значения из интерфейса. Если токен задан ещё и в окружении, бот продолжит работать с ним.
export async function disconnectTelegram() {
  await clearTelegramSettings();
  restartBot();
}
