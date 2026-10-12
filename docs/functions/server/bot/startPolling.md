# startPolling

## Назначение
Long polling Telegram: получает обновления, отвечает только владельцу, передаёт сообщения в команды и нажатия кнопок в обработчик callback.

## Где объявлено
`server/src/bot/poller.js:L28-61#startPolling`

## Вход и выход
- Вход: `handle` (обработчик команд), `onCallback` (обработчик кнопок).
- Выход: бесконечный цикл; без настроенного Telegram сразу завершается.

## Алгоритм
1. Без `TELEGRAM_BOT_TOKEN` и `TELEGRAM_OWNER_ID` поллер не запускается: `server/src/bot/poller.js:L29@if (!telegramEnabled())`.
2. Настраивает кнопку меню Mini App: `server/src/bot/poller.js:L4-11#setMenuButton`.
3. Читает обновления `getUpdates`: `server/src/bot/poller.js:L39@const updates = await telegramApi('getUpdates'`.
4. Нажатие кнопки уходит в `handleButton`: `server/src/bot/poller.js:L43@if (update.callback_query)`.
5. Сообщение от чужого аккаунта пропускается: `server/src/bot/poller.js:L50@if (String(msg.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) continue;`.
6. Ошибки сети ждут 5 секунд и продолжают цикл: `server/src/bot/poller.js:L58@await new Promise((resolve) => setTimeout(resolve, 5000));`.

## Связи
- Транспорт: `docs/architecture/telegram-transport.md:L5#Транспорт`.
- Команды: `docs/functions/server/bot/handleCommand.md:L3#Назначение`.
