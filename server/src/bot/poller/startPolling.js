import { telegramApi, telegramEnabled } from '../../services/telegram/api.js';
import { sendTelegramTo } from '../../services/telegram/send.js';
import { setMenuButton } from './setMenuButton.js';
import { deliver } from './deliver.js';
import { handleButton } from './handleButton.js';
import { getTelegramConfig } from '../../services/telegram/runtime.js';

// Long polling: бот отвечает только владельцу (ID владельца из настроек Telegram).
// isCurrent возвращает false, когда запущен новый цикл (токен сменили или бота отключили): старый цикл тогда выходит.
export async function startPolling(
  handle,
  onCallback = async () => 'Кнопка не поддерживается',
  onGuest = async () => null,
  isCurrent = () => true,
) {
  if (!telegramEnabled()) {
    console.log('Telegram не настроен (токен и ID владельца задаются в настройках), бот не запущен');
    return;
  }

  await setMenuButton();

  let offset = 0;
  while (isCurrent()) {
    try {
      const updates = await telegramApi('getUpdates', { offset, timeout: 25 });
      for (const update of updates) {
        if (!isCurrent()) return;
        offset = update.update_id + 1;

        if (update.callback_query) {
          await handleButton(update.callback_query, onCallback);
          continue;
        }

        const msg = update.message;
        if (!msg?.text) continue;
        if (String(msg.from?.id) !== String(getTelegramConfig().ownerId)) {
          // Не владелец: запрос доступа к порталу (см. services/access)
          const guestReply = await onGuest(msg).catch(() => null);
          if (guestReply) await sendTelegramTo(msg.chat.id, guestReply);
          continue;
        }

        const replyToText = msg.reply_to_message?.text || '';
        const reply = await handle(msg.text, replyToText).catch((err) => `Ошибка: ${err.message}`);
        await deliver(reply);
      }
    } catch (err) {
      console.error('Telegram poll:', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
