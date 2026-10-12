# decodeCallback

## Назначение
Разбирает callback_data и отбрасывает всё, что не похоже на известное действие и корректный ID.

## Где объявлено
`server/src/bot/callbackData.js:L10-14#decodeCallback`

## Вход и выход
- Вход: `data`. Выход: `{ action, id }` или `null`.

## Алгоритм
1. Проверяет формат регулярным выражением (24 шестнадцатеричных символа): `server/src/bot/callbackData.js:L11@const match = /^([a-z]+):([a-f0-9]{24})$/`.
2. Проверяет, что действие входит в список `ACTIONS`: `server/src/bot/callbackData.js:L12@ACTIONS.includes(match[1])`.

## Связи
- Список действий: `server/src/bot/callbackData.js:L4-4#ACTIONS`. Использование: `docs/functions/server/bot/handleCallback.md:L13#Алгоритм`.
