import { telegramApi, sendTelegramTo, telegramEnabled } from '../../services/telegram.js';
import { setMenuButton } from './setMenuButton.js';
import { deliver } from './deliver.js';
import { handleButton } from './handleButton.js';

// Long polling: бот отвечает только владельцу (TELEGRAM_OWNER_ID)
export async function startPolling(handle, onCallback = async () => 'Кнопка не поддерживается', onGuest = async () => null) {
  if (!telegramEnabled()) {
    console.log('Telegram не настроен (TELEGRAM_BOT_TOKEN, TELEGRAM_OWNER_ID), бот не запущен');
    return;
  }

  await setMenuButton();

  let offset = 0;
  for (;;) {
    try {
      const updates = await telegramApi('getUpdates', { offset, timeout: 25 });
      for (const update of updates) {
        offset = update.update_id + 1;

        if (update.callback_query) {
          await handleButton(update.callback_query, onCallback);
          continue;
        }

        const msg = update.message;
        if (!msg?.text) continue;
        if (String(msg.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) {
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
