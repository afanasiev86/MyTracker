import { sendTelegram } from '../../services/telegram.js';

// Ответ владельцу: строка или { text, reply_markup }
export async function deliver(reply) {
  if (!reply) return;
  if (typeof reply === 'string') return sendTelegram(reply);
  return sendTelegram(reply.text, { reply_markup: reply.reply_markup });
}
