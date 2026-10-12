# telegramEnabled

## Назначение
Включён ли Telegram: задан ли токен бота и владелец (из настроек в интерфейсе или из окружения).

## Где объявлено
`server/src/services/telegram/api.js:L4-6#telegramEnabled`

## Вход и выход
- Выход: `boolean`.

## Алгоритм
1. Проверяет оба параметра через `getTelegramConfig` (интерфейс важнее окружения): `server/src/services/telegram/api.js:L5@return Boolean(getTelegramConfig().botToken`.

## Связи
- Если `false`, `notify` и поллер ничего не делают: `docs/functions/server/telegram/notify.md:L12#Алгоритм`.
