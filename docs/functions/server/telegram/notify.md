# notify

## Назначение
Уведомление владельцу, которое не должно ломать основной процесс: ошибки Telegram только логируются.

## Где объявлено
`server/src/services/notify/owner.js:L6-9#notify`

## Вход и выход
- Вход: `text`, `extra` (клавиатура и т. п.). Выход: `Promise<void>`.

## Алгоритм
1. Без настроенного Telegram ничего не делает: `server/src/services/notify/owner.js:L7@if (!telegramEnabled()) return;`.
2. Отправляет через `sendTelegram`, ошибку гасит и пишет в лог: `server/src/services/notify/owner.js:L8@console.error('Telegram:'`.

## Связи
- Используется воркером (`server/src/worker/notifyRun.js:L16@await notify(`) и дайджестом.
