# runTask

## Назначение
Главная функция воркера: готовит рабочую копию, запускает Claude, разбирает результат и выставляет итоговый статус задачи. Именно здесь собирается весь жизненный цикл запуска.

## Где объявлено
`server/src/worker/runTask.js:L18-106#runTask`

## Вход и выход
- Вход: `taskId`; `{ answer }` — ответ владельца, если запуск продолжает вопрос.
- Выход: `Promise<void>`. Результат сохраняется в задаче (`runs`, статус) и отправляется в Telegram.

## Алгоритм
1. Загружает задачу и выходит, если она уже не в работе: `server/src/worker/runTask.js:L21@if (!task || task.status !== 'in_progress') return;`.
2. Готовит ветку и рабочую копию: `server/src/worker/runTask.js:L36@const startPoint = await prepareWorktree(cfg, repo, branch, wt);`.
3. Выдаёт токен воркеру на 2 часа и передаёт путь к скрипту API: `server/src/worker/runTask.js:L9@TRACKER_CLI`.
4. Выбирает аргументы запуска: продолжение сессии (`--resume`), передача ответа без сессии или новый запуск `/implement-task`: `server/src/worker/launchArgs.js:L13@return ['-p', answer, '--resume'`.
5. Пишет прогресс в базу, при этом записи идут по очереди: `server/src/worker/runTask.js:L51@let writes = Task.updateOne`.
6. Запускает Claude через `runClaude` и ждёт его завершения: `server/src/worker/runTask.js:L56@const res = await runClaude(`.
7. Читает итоговое событие потока и вопрос, сохранённый через API: `server/src/worker/runTask.js:L65@const data = findResult(res.stdout);`, `server/src/worker/runTask.js:L68@const fresh = await Task.findById`.
8. Определяет исход по порядку приоритета (см. таблицу ниже).
9. Сохраняет задачу, удаляет рабочую копию и отправляет уведомление: `server/src/worker/notifyRun.js:L15@await notify(`.

Порядок исходов (первый подходящий побеждает):

| Условие | Статус | Строка |
|---|---|---|
| отмена вручную | `failed` | `server/src/worker/outcome.js:L9@if (res.reason === 'cancelled')` |
| превышен таймаут | `failed` | `server/src/worker/outcome.js:L12@if (res.reason === 'timeout') {` |
| лимит подписки | `ready` | `server/src/worker/outcome.js:L20@if (isLimitError(res.stdout) || isLimitError(res.stderr)) {` |
| ненулевой код или `is_error` | `failed` | `server/src/worker/outcome.js:L28@if (res.code !== 0 || data?.is_error) {` |
| есть сохранённый вопрос | `waiting` | `server/src/worker/outcome.js:L36@if (question) {` |
| нет новых коммитов | `failed` | `server/src/worker/outcome.js:L44@Claude не создал коммитов.` |
| есть коммиты | `review` | `server/src/worker/outcome.js:L50@return { status: 'review'` |

## Ошибки и граничные случаи
- Любое исключение (например, сбой git) попадает в общий `catch` и даёт статус `failed` с текстом «Ошибка воркера»: `server/src/worker/runTask.js:L84@Ошибка воркера`.
- Задача может быть удалена во время запуска. Тогда `task.save()` упадёт, и это будет видно только в логах. Удаление задач в процессе запуска сейчас запрещено на уровне интерфейса, поэтому риск низкий.
- Рабочая копия удаляется после сохранения, даже при ошибке: `server/src/worker/runTask.js:L104@await git(repo, ['worktree', 'remove'`. Если удаление упало, копия остаётся до следующего запуска (`prepareWorktree` удаляет её принудительно).

## Связи
- Конвейер целиком: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
- Исходы: `docs/architecture/run-pipeline.md:L12#Исходы запуска`.
- Прогресс: `docs/architecture/stream-progress.md:L8#Запись прогресса`.
