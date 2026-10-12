# startTask

## Назначение
Единая точка запуска задачи в Claude. Её вызывают и API (`POST /api/tasks/:id/run`), и бот (`/run`), и кнопка «Вернуть в работу» под уведомлением.

## Где объявлено
`server/src/services/runs.js:L7-16#startTask`

## Вход и выход
- Вход: `task` — документ Mongoose задачи.
- Выход: `{ task }` при успехе или `{ error }` с текстом, если запуск недоступен.

## Алгоритм
1. Проверяет, что статус допускает запуск (`ready`, `review`, `failed`): `server/src/services/runs.js:L8@if (!RUNNABLE_FROM.includes(task.status))`.
2. Переводит задачу в «В работе» и сохраняет, чтобы интерфейс сразу показал статус: `server/src/services/runs.js:L12@task.status = 'in_progress';`.
3. Ставит фактическую работу в очередь проекта: `server/src/services/runs.js:L14@enqueue(task.project, () => runTask(task._id));`.
4. Возвращает задачу без ожидания завершения, поэтому API отвечает быстро (`202`, см. `server/src/routes/tasks.js:L134-144#POST /:id/run`).

## Ошибки и граничные случаи
- Строка `server/src/services/runs.js:L11@if (task.status === 'failed') task.status = 'ready';` перезаписывается следующей строкой и ничего не делает. Это лишний код: статус `failed` всё равно переходит в `in_progress`. Удалить при следующем изменении файла.
- Между проверкой статуса и сохранением нет блокировки. Два одновременных запроса на один и тот же статус могут поставить задачу в очередь дважды. Воркер защищён тем, что `runTask` выходит, если статус уже не `in_progress` (`server/src/worker/runTask.js:L115@if (!task || task.status !== 'in_progress') return;`), но для двух процессов это не спасает. Сейчас это не проблема, так как запуск инициирует один владелец.

## Связи
- Очередь: `docs/functions/server/worker/enqueue.md:L3#Назначение`.
- Жизненный цикл запуска: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
- Правила статусов: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
