# handleButton

## Назначение
Обрабатывает нажатие inline-кнопки: проверяет владельца, сразу отвечает Telegram (иначе кнопка «крутится») и отправляет результат.

## Где объявлено
`server/src/bot/poller.js:L20-25#handleButton`

## Вход и выход
- Вход: `query` (callback_query из Telegram), `onCallback`.
- Выход: нет, результат отправляется в чат.

## Алгоритм
1. Чужие нажатия игнорируются: `server/src/bot/poller.js:L21@if (String(query.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) return;`.
2. Подтверждение нажатия: `server/src/bot/poller.js:L22@answerCallbackQuery`.
3. Вызов обработчика `handleCallback` и отправка ответа: `server/src/bot/poller.js:L23@const reply = await onCallback(query.data)`.

## Связи
- Обработчик действий: `docs/functions/server/bot/handleCallback.md:L13#Алгоритм`.
