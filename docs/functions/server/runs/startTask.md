# startTask

## Назначение
Единая точка запуска задачи в Claude. Её вызывают и API (`POST /api/tasks/:id/run`), и бот (`/run`), и кнопка «Вернуть в работу» под уведомлением.

## Где объявлено
`server/src/services/runs.js:L7-15#startTask`

## Вход и выход
- Вход: `task` — документ Mongoose задачи.
- Выход: `{ task }` при успехе или `{ error }` с текстом, если запуск недоступен.

## Алгоритм
1. Проверяет, что статус допускает запуск (`ready`, `review`, `failed`): `server/src/services/runs.js:L8@if (!RUNNABLE_FROM.includes(task.status))`.
2. Переводит задачу в «В работе» и сохраняет, чтобы интерфейс сразу показал статус: `server/src/services/runs.js:L11@task.status = 'in_progress';`.
3. Ставит фактическую работу в очередь проекта с приоритетом задачи (срочные уходят вперёд): `server/src/services/runs.js:L13@enqueue(task.project, () => runTask(task._id), { priority: task.priority });`.
4. Возвращает задачу без ожидания завершения, поэтому API отвечает быстро (`202`, см. `server/src/routes/tasks/runTaskRoute.js:L5-15#runTaskRoute`).

## Ошибки и граничные случаи
- Между проверкой статуса и сохранением нет блокировки. Два одновременных запроса на один статус могут поставить задачу в очередь дважды. Воркер защищён: `runTask` выходит, если статус уже не `in_progress` (см. «Алгоритм», шаг 5 в `docs/functions/server/worker/runTask.md:L13#Алгоритм`). Сейчас запуск инициирует один владелец, поэтому риск низкий.
- Мёртвая строка `failed → ready` удалена: статус `failed` сразу переходит в `in_progress`, как и был.

## Связи
- Очередь: `docs/functions/server/worker/enqueue.md:L3#Назначение`.
- Жизненный цикл запуска: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
- Правила статусов: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
