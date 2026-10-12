# answerTask

## Назначение
Передаёт ответ владельца на вопрос Claude и продолжает ту же сессию. Ответ можно дать из трекера, из Mini App или ответом на сообщение в Telegram.

## Где объявлено
`server/src/services/runs.js:L19-29#answerTask`

## Вход и выход
- Вход: `task` (документ задачи), `text` (ответ).
- Выход: `{ task }` или `{ error }`, если задача не ждёт ответа.

## Алгоритм
1. Проверяет статус: задача должна быть в `waiting`: `server/src/services/runs.js:L20@if (task.status !== 'waiting')`.
2. Сохраняет ответ как комментарий, чтобы он остался в истории: `server/src/services/runs.js:L19-29#answerTask`.
3. Очищает вопрос и переводит в «В работе»: `server/src/services/runs.js:L24@task.pendingQuestion = '';`.
4. Ставит запуск в очередь с параметром `answer`, и воркер продолжит сессию `--resume`: `server/src/services/runs.js:L27@enqueue(task.project, () => runTask(task._id, { answer: text }));`.

## Ошибки и граничные случаи
- Если `sessionId` потерян, воркер не сможет продолжить сессию и передаст ответ вместе с задачей: см. `server/src/worker/runTask.js:L135@} else if (answer) {`.
- Два ответа подряд: после первого статус уже `in_progress`, поэтому второй вернёт ошибку «Задача сейчас не ждёт ответа». Это защита от дубля.

## Связи
- Маршрут: ``server/src/routes/tasks.js:L165-176#POST /:id/answer``.
- Воркер: `docs/functions/server/worker/runTask.md:L3#Назначение`.
- Поток вопросов: `docs/features/tasks-and-runs.md:L11#Вопросы от Claude`.
