# runTask

## Назначение
Главная функция воркера: готовит рабочую копию, запускает Claude, разбирает результат и выставляет итоговый статус задачи. Именно здесь собирается весь жизненный цикл запуска.

## Где объявлено
`server/src/worker/runTask.js:L21-118#runTask`

## Вход и выход
- Вход: `taskId`; `{ answer }` — ответ владельца, если запуск продолжает вопрос.
- Выход: `Promise<void>`. Результат сохраняется в задаче (`runs`, статус) и отправляется в Telegram.

## Алгоритм
1. Загружает задачу и выходит, если она уже не в работе: `server/src/worker/runTask.js:L24@if (!task || task.status !== 'in_progress') return;`.
2. Готовит ветку в клоне проекта (целевая ветка — UAT или основная при «Пушить сразу в ПРОД»): `server/src/worker/runTask.js:L42@const startPoint = await prepareWorkdir(repo, branch, target, base);` (основная ветка, UAT и режим «Пушить сразу в ПРОД» берутся из `branchSettings`).
3. Выдаёт токен воркеру на 2 часа и передаёт путь к скрипту API: `server/src/worker/runTask.js:L8@TRACKER_CLI`.
4. Выбирает аргументы запуска: продолжение сессии (`--resume`), передача ответа без сессии или новый запуск `/implement-task`: `server/src/worker/launchArgs.js:L19@'--resume', sessionId`. К каждому запуску добавляется полный путь к скрипту трекера.
5. Пишет прогресс в базу, при этом записи идут по очереди: `server/src/worker/runTask.js:L58@let writes = Task.updateOne`.
6. Запускает Claude через `runClaude` и ждёт его завершения: `server/src/worker/runTask.js:L63@const res = await runClaude(`.
7. Читает итоговое событие потока и вопрос, сохранённый через API: `server/src/worker/runTask.js:L72@const data = findResult(res.stdout);`, `server/src/worker/runTask.js:L75@const fresh = await Task.findById`.
8. Определяет исход по порядку приоритета (см. таблицу ниже).
9. Сохраняет задачу и отправляет уведомление (клон остаётся на диске): `server/src/worker/notifyRun.js:L16@await notify(`.

Порядок исходов (первый подходящий побеждает):

| Условие | Статус | Строка |
|---|---|---|
| отмена вручную | `failed` | `server/src/worker/outcome.js:L13@if (res.reason === 'cancelled')` |
| превышен таймаут | `failed` | `server/src/worker/outcome.js:L16@if (res.reason === 'timeout') {` |
| лимит подписки (запуск упал, и в итоговом событии или stderr есть признак лимита; весь вывод не проверяется) | `ready` | `server/src/worker/outcome.js:L29@if (runFailed && isLimitError(errorText)) {` |
| ненулевой код или `is_error` | `failed` | `server/src/worker/outcome.js:L37@if (res.code !== 0 || data?.is_error) {` |
| есть сохранённый вопрос | `waiting` | `server/src/worker/outcome.js:L45@if (question) {` |
| нет новых коммитов | `failed` | `server/src/worker/outcome.js:L53@Claude не создал коммитов.` |
| есть коммиты | `review` | `server/src/worker/outcome.js:L67@status: 'review',` (перед этим `publishToBase` в целевую ветку; не удалось влить: `failed`) |

## Ошибки и граничные случаи
- Любое исключение (например, сбой git) попадает в общий `catch` и даёт статус `failed` с текстом «Ошибка воркера»: `server/src/worker/runTask.js:L92@Ошибка воркера`.
- Задача может быть удалена во время запуска. Тогда `task.save()` упадёт, и это будет видно только в логах. Удаление задач в процессе запуска сейчас запрещено на уровне интерфейса, поэтому риск низкий.
- Клон после запуска не очищается: следующий запуск стирает остатки сам (`docs/functions/server/worker/prepareWorkdir.md:L13#Алгоритм`).

## Связи
- Конвейер целиком: `docs/architecture/run-pipeline.md:L5#Этапы запуска`.
- Исходы: `docs/architecture/run-pipeline.md:L12#Исходы запуска`.
- Прогресс: `docs/architecture/stream-progress.md:L8#Запись прогресса`.
