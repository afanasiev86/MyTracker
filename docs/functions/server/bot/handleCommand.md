# handleCommand

## Назначение
Обрабатывает текст сообщения владельца в боте: команды `/new`, `/ready`, `/run`, `/answer`, `/cancel`, `/status`, `/app`, а также ответ на сообщение с ID задачи.

## Где объявлено
`server/src/bot/commands/handleCommand.js:L13-27#handleCommand`

## Вход и выход
- Вход: `text`, `replyToText` (текст сообщения, на которое ответили).
- Выход: строка или `{ text, reply_markup }` для Telegram.

## Алгоритм
1. Ответ на сообщение с ID задачи считается ответом на вопрос: `server/src/bot/commands/handleCommand.js:L14@const replyId = replyToText.match(ID_IN_TEXT)`.
2. Разбор команды: `server/src/bot/commands/parse.js:L5-8#parseCommand`.
3. `/new` проверяет, что проект существует, и создаёт задачу: `server/src/bot/commands/newTask.js:L9@if (!(await Project.exists({ slug: project })))`.
4. `/run` и `/ready` работают через `startTask` и правила переходов: `server/src/bot/commands/readyRunCommand.js:L22@const result = await startTask(task);`.
5. Остальное отвечает справкой `server/src/bot/commands/handleCommand.js:L26@return HELP`.

## Связи
- Поллер, который вызывает функцию: `docs/functions/server/bot/startPolling.md:L13#Алгоритм`.
- Ответ на вопрос: `docs/functions/server/runs/answerTask.md:L13#Алгоритм`.
