// Кнопка открытия Mini App. Без HTTPS-адреса в окружении сообщаем, что её нет.
export function appButton() {
  const url = process.env.TELEGRAM_MINIAPP_URL;
  if (!url) {
    return 'Mini App не настроен: задайте TELEGRAM_MINIAPP_URL (HTTPS-адрес) и перезапустите сервер.';
  }
  return {
    text: 'Трекер',
    reply_markup: { inline_keyboard: [[{ text: 'Открыть трекер', web_app: { url } }]] },
  };
}
