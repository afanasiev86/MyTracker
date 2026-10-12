# telegramApi

## Назначение
Единый вызов Telegram Bot API через fetch, без сторонних библиотек.

## Где объявлено
`server/src/services/telegram/api.js:L8-18#telegramApi`

## Вход и выход
- Вход: `method` (имя метода Bot API), `body`. Выход: поле `result` ответа.

## Алгоритм
1. Собирает URL с токеном бота: `server/src/services/telegram/api.js:L8-18#telegramApi`.
2. Отправляет JSON методом POST.
3. Если Telegram вернул `ok: false`, бросает ошибку с описанием: `server/src/services/telegram/api.js:L16@if (!data.ok) throw new Error`.

## Ошибки и граничные случаи
- Токен попадает в URL, поэтому в логах ошибок его нет: в сообщении только `method` и описание от Telegram.

## Связи
- Транспорт: `docs/architecture/telegram-transport.md:L5#Транспорт`.
