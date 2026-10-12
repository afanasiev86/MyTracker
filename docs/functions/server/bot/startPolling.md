# startPolling

## Назначение
Long polling Telegram: получает обновления, отвечает только владельцу, передаёт сообщения в команды и нажатия кнопок в обработчик callback.

## Где объявлено
`server/src/bot/poller.js:L30-68#startPolling`

## Вход и выход
- Вход: `handle` (обработчик команд), `onCallback` (обработчик кнопок).
- Выход: бесконечный цикл; без настроенного Telegram сразу завершается.

## Алгоритм
1. Без `TELEGRAM_BOT_TOKEN` и `TELEGRAM_OWNER_ID` поллер не запускается: `server/src/bot/poller.js:L31@if (!telegramEnabled())`.
2. Настраивает кнопку меню Mini App: `server/src/bot/poller.js:L4-13#setMenuButton`.
3. Читает обновления `getUpdates`: `server/src/bot/poller.js:L41@const updates = await telegramApi('getUpdates'`.
4. Нажатие кнопки уходит в `handleButton`: `server/src/bot/poller.js:L45@if (update.callback_query)`.
5. Сообщение от чужого аккаунта не обрабатывается как команда. Оно передаётся в `handleGuest` (запрос доступа к порталу): `server/src/bot/poller.js:L52@if (String(msg.from?.id) !== String(process.env.TELEGRAM_OWNER_ID)) {`. Подробно: `docs/features/client-portal.md:L5#Как заказчик получает доступ`.
6. Ошибки сети ждут 5 секунд и продолжают цикл: `server/src/bot/poller.js:L65@await new Promise((resolve) => setTimeout(resolve, 5000));`.

## Связи
- Транспорт: `docs/architecture/telegram-transport.md:L5#Транспорт`.
- Команды: `docs/functions/server/bot/handleCommand.md:L3#Назначение`.
