# runTask

## Назначение
Главная функция воркера: готовит рабочую копию, запускает Claude, разбирает результат и выставляет итоговый статус задачи. Именно здесь собирается весь жизненный цикл запуска.

## Где объявлено
`server/src/worker/runTask.js:L20-114#runTask`

## Вход и выход
- Вход: `taskId`; `{ answer }` — ответ владельца, если запуск продолжает вопрос.
- Выход: `Promise<void>`. Результат сохраняется в задаче (`runs`, статус) и отправляется в Telegram.

## Алгоритм
1. Загружает задачу и выходит, если она уже не в работе: `server/src/worker/runTask.js:L23@if (!task || task.status !== 'in_progress') return;`.
2. Готовит ветку и рабочую копию: `server/src/worker/runTask.js:L39@const startPoint = await prepareWorktree(repo, branch, wt, base);` (основная ветка и режим «коммитить сразу в неё» берутся из `branchSettings`).
3. Выдаёт токен воркеру на 2 часа и передаёт путь к скрипту API: `server/src/worker/runTask.js:L9@TRACKER_CLI`.
4. Выбирает аргументы запуска: продолжение сессии (`--resume`), передача ответа без сессии или новый запуск `/implement-task`: `server/src/worker/launchArgs.js:L19@'--resume', sessionId`. К каждому запуску добавляется полный путь к скрипту трекера.
5. Пишет прогресс в базу, при этом записи идут по очереди: `server/src/worker/runTask.js:L54@let writes = Task.updateOne`.
6. Запускает Claude через `runClaude` и ждёт его завершения: `server/src/worker/runTask.js:L59@const res = await runClaude(`.
7. Читает итоговое событие потока и вопрос, сохранённый через API: `server/src/worker/runTask.js:L68@const data = findResult(res.stdout);`, `server/src/worker/runTask.js:L71@const fresh = await Task.findById`.
8. Определяет исход по порядку приоритета (см. таблицу ниже).
9. Сохраняет задачу, удаляет рабочую копию и отправляет уведомление: `server/src/worker/notifyRun.js:L16@await notify(`.

Порядок исходов (первый подходящий побеждает):

| Условие | Статус | Строка |
|---|---|---|
| отмена вручную | `failed` | `server/src/worker/outcome.js:L28@if (res.reason === 'cancelled')` |
| превышен таймаут | `failed` | `server/src/worker/outcome.js:L31@if (res.reason === 'timeout') {` |
| лимит подписки (запуск упал, и в итоговом событии или stderr есть признак лимита; весь вывод не проверяется) | `ready` | `server/src/worker/outcome.js:L44@if (runFailed && isLimitError(errorText)) {` |
| ненулевой код или `is_error` | `failed` | `server/src/worker/outcome.js:L52@if (res.code !== 0 || data?.is_error) {` |
| есть сохранённый вопрос | `waiting` | `server/src/worker/outcome.js:L60@if (question) {` |
| нет новых коммитов, и коммита этой задачи нет в истории ветки | `failed` | `server/src/worker/outcome.js:L69@Claude не создал коммитов.` |
| нет новых коммитов, но коммит этой задачи уже есть в истории (прошлый запуск уже всё сделал) | `review` | `server/src/worker/outcome.js:L71@Задача уже была выполнена` (проверка: `server/src/worker/outcome.js:L10-14#hasTaskCommit`) |
| есть коммиты | `review` | `server/src/worker/outcome.js:L88@'Готово к проверке'` (в режиме «в основную ветку» перед этим `publishToBase`; не удалось влить: `failed`) |

## Ошибки и граничные случаи
- Любое исключение (например, сбой git) попадает в общий `catch` и даёт статус `failed` с текстом «Ошибка воркера»: `server/src/worker/runTask.js:L90@Ошибка воркера`.
- Задача может быть удалена во время запуска. Тогда `task.save()` упадёт, и это будет видно только в логах. Удаление задач в процессе запуска сейчас запрещено на уровне интерфейса, поэтому риск низкий.
- Рабочая копия удаляется после сохранения, даже при ошибке: `server/src/worker/runTask.js:L112@await git(repo, ['worktree', 'remove'`. Если удаление упало, копия остаётся до следующего запуска (`prepareWorktree` удаляет её принудительно).

## Связи
- Конвейер целиком: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
- Исходы: `docs/architecture/run-pipeline.md:L12#Исходы запуска`.
- Прогресс: `docs/architecture/stream-progress.md:L8#Запись прогресса`.
