import { telegramApi } from '../../services/telegram/api.js';
import { getConfig } from '../../config.js';

// Кнопка меню бота открывает Mini App (нужен HTTPS-адрес в TELEGRAM_MINIAPP_URL)
export async function setMenuButton() {
  const url = getConfig().telegram.miniAppUrl;
  if (!url) return;
  const menu = { type: 'web_app', text: 'Трекер', web_app: { url } };
  // Для владельца и для всех остальных (заказчики открывают портал той же кнопкой)
  await telegramApi('setChatMenuButton', { chat_id: getConfig().telegram.ownerId, menu_button: menu })
    .catch((err) => console.error('Menu button:', err.message));
  await telegramApi('setChatMenuButton', { menu_button: menu })
    .catch((err) => console.error('Menu button default:', err.message));
}
