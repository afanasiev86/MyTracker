# encodeCallback

## Назначение
Формирует callback_data кнопки: `действие:id задачи`. Telegram ограничивает её 64 байтами.

## Где объявлено
`server/src/bot/callbackData.js:L6-8#encodeCallback`

## Вход и выход
- Вход: `action`, `taskId`. Выход: строка.

## Алгоритм
1. Склеивает действие и ID через двоеточие: `server/src/bot/callbackData.js:L6-8#encodeCallback`.

## Ограничения
- Длина: действие не длиннее 6 символов + 24 символа ID, это укладывается в лимит (проверяется в `server/test/bot.test.js:L18@укладывается в лимит Telegram`).
