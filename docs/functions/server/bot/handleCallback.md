# handleCallback

## Назначение
Выполняет действие кнопки под уведомлением о проверке: показать diff, принять результат или вернуть задачу в работу.

## Где объявлено
`server/src/bot/callbacks.js:L20-38#handleCallback`

## Вход и выход
- Вход: `data` — строка callback_data вида `действие:id`.
- Выход: строка для ответа владельцу.

## Алгоритм
1. Разбирает данные кнопки: `server/src/bot/callbacks.js:L21@const parsed = decodeCallback(data);` (см. `docs/functions/server/bot/decodeCallback.md:L3#Назначение`).
2. Загружает задачу: `server/src/bot/callbacks.js:L25@const task = await Task.findById(parsed.id);`.
3. `diff` показывает diff, обрезанный под лимит Telegram: `server/src/bot/callbacks.js:L10-17#showDiff`.
4. `accept` вызывает `acceptTask`: `server/src/bot/callbacks.js:L31@const result = await acceptTask(task);`.
5. Остальное (`rework`) вызывает `startTask`, то же, что кнопка «Вернуть в работу» в интерфейсе: `server/src/bot/callbacks.js:L36@const result = await startTask(task);`.

## Связи
- Кнопки: `docs/functions/server/bot/reviewKeyboard.md:L3#Назначение`.
- Принятие: `docs/functions/server/runs/acceptTask.md:L3#Назначение`.
- Запуск: `docs/functions/server/runs/startTask.md:L3#Назначение`.
