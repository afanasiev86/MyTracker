# reviewKeyboard

## Назначение
Клавиатура под уведомлением о проверке: «Открыть diff», «Принять», «Вернуть в работу».

## Где объявлено
`server/src/bot/callbackData.js:L17-27#reviewKeyboard`

## Вход и выход
- Вход: `taskId`. Выход: объект `reply_markup` для Telegram.

## Алгоритм
1. Первая строка кнопок: `server/src/bot/callbackData.js:L20@text: 'Открыть diff'`.
2. Вторая строка: принять и вернуть в работу: `server/src/bot/callbackData.js:L22@text: 'Принять'`.

## Связи
- Используется в `server/src/worker/notifyRun.js:L14@review: reviewKeyboard` при статусе «На проверке».
- Формат данных: `docs/functions/server/bot/encodeCallback.md:L3#Назначение`.
