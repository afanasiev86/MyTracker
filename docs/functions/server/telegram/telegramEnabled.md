# telegramEnabled

## Назначение
Включён ли Telegram: задан ли токен бота и владелец.

## Где объявлено
`server/src/services/telegram/api.js:L3-5#telegramEnabled`

## Вход и выход
- Выход: `boolean`.

## Алгоритм
1. Проверяет оба параметра окружения: `server/src/services/telegram/api.js:L4@return Boolean(process.env.TELEGRAM_BOT_TOKEN`.

## Связи
- Если `false`, `notify` и поллер ничего не делают: `docs/functions/server/telegram/notify.md:L12#Алгоритм`.
