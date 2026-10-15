# stopRun

## Назначение
Останавливает запущенный процесс Claude и запоминает причину: `cancelled` (вручную) или `timeout` (по времени).

## Где объявлено
`server/src/worker/processes/stopRun.js:L6-18#stopRun`

## Вход и выход
- Вход: `taskId`, `reason`.
- Выход: `true`, если сигнал отправлен; `false`, если процесса нет.

## Алгоритм
1. Находит запись в реестре: `server/src/worker/processes/stopRun.js:L7@const entry = running.get(String(taskId));`.
2. Сохраняет причину, чтобы воркер потом понял, почему процесс завершился: `server/src/worker/processes/stopRun.js:L9@entry.reason = reason;`.
3. Отправляет SIGTERM: `server/src/worker/processes/stopRun.js:L10@entry.child.kill('SIGTERM');`.

## Ошибки и граничные случаи
- Если процесс игнорирует SIGTERM, через 10 секунд отправляется SIGKILL: `server/src/worker/processes/stopRun.js:L2@KILL_AFTER_MS`. Таймер снимается при завершении процесса (`unregisterRun`).
- Реестр хранит процессы в памяти, поэтому после перезапуска сервера отмена работает только для процессов текущего сеанса. Остальные задачи помечаются как ошибка при старте.

## Связи
- Реестр: `docs/functions/server/worker/registerRun.md:L3#Назначение`.
- Отмена и таймаут: `docs/architecture/run-pipeline.md:L26#Отмена и таймаут`.
