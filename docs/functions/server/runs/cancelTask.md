# cancelTask

## Назначение
Отменяет запуск, который идёт сейчас. Если процесса уже нет (например, сервер перезапускали), сразу переводит задачу в «Ошибку».

## Где объявлено
`server/src/services/runs.js:L32-43#cancelTask`

## Вход и выход
- Вход: `task`.
- Выход: `{ task, stopping }`: `stopping: true`, если процесс получил сигнал остановки; `{ error }`, если задача не в работе.

## Алгоритм
1. Отменить можно только задачу в работе: `server/src/services/runs.js:L34@Отменить можно только задачу в работе`.
2. Пытается остановить процесс с причиной `cancelled`: `server/src/services/runs.js:L36@if (stopRun(task._id, 'cancelled'))`.
3. Если процесса нет, ставит «Ошибку» и системный комментарий: `server/src/services/runs.js:L40@Запуск отменён вручную.`.

## Ошибки и граничные случаи
- При успешной остановке статус не меняется здесь. Его ставит воркер, когда процесс завершится и увидит причину `cancelled`: `server/src/worker/runTask.js:L167@if (res.reason === 'cancelled')`.
- Сигнал SIGTERM. Если процесс Claude его игнорирует, он продолжит работать. Эскалации до SIGKILL в проекте нет: это известное ограничение, см. `docs/functions/server/worker/stopRun.md:L18#Ошибки и граничные случаи`.

## Связи
- Реестр процессов: `docs/functions/server/worker/stopRun.md:L3#Назначение`.
- Маршрут: ``server/src/routes/tasks.js:L179-189#POST /:id/cancel``.
