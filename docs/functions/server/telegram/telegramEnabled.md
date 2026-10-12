# telegramEnabled

## Назначение
Включён ли Telegram: задан ли токен бота и владелец.

## Где объявлено
`server/src/services/telegram/api.js:L4-6#telegramEnabled`

## Вход и выход
- Выход: `boolean`.

## Алгоритм
1. Проверяет оба параметра окружения: `server/src/services/telegram/api.js:L5@return Boolean(getConfig().telegram.botToken`.

## Связи
- Если `false`, `notify` и поллер ничего не делают: `docs/functions/server/telegram/notify.md:L12#Алгоритм`.
