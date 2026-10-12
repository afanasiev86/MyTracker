# sendTelegram

## Назначение
Отправляет текст владельцу. Обрезает до 4000 символов (лимит Telegram).

## Где объявлено
`server/src/services/telegram/send.js:L14-16#sendTelegram`

## Вход и выход
- Вход: `text`, `extra` (например `reply_markup`). Выход: результат `sendMessage`.

## Алгоритм
1. Берёт ID владельца и обрезает текст: `server/src/services/telegram/send.js:L8@text: text.slice(0, 4000)`.
2. Вызывает `telegramApi('sendMessage', ...)`: `server/src/services/telegram/send.js:L6@return telegramApi('sendMessage'`.

## Связи
- Вызывается из `docs/functions/server/telegram/notify.md:L12#Алгоритм` и из поллера.
