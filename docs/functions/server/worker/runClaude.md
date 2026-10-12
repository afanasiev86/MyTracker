# runClaude

## Назначение
Запускает процесс `claude` в рабочей копии, отслеживает таймаут и отмену, читает поток событий и передаёт строки прогресса наружу.

## Где объявлено
`server/src/worker/runTask.js:L46-91#runClaude`

## Вход и выход
- Вход: `bin`, `args`, `{ cwd, env, taskId, timeoutMs, onProgress }`.
- Выход: `Promise<{ code, stdout, stderr, reason }>`. `reason` — `'cancelled'`, `'timeout'` или `null`.

## Алгоритм
1. Запускает процесс и регистрирует его для отмены: `server/src/worker/runTask.js:L48@const child = spawn(bin, args, { cwd, env });`, `server/src/worker/runTask.js:L49@registerRun(taskId, child);`.
2. Ставит таймер таймаута: `server/src/worker/runTask.js:L50@const timer = setTimeout(() => stopRun(taskId, 'timeout'), timeoutMs);`.
3. На каждый кусок stdout накапливает строки через `LineSplitter` и разбирает их: `server/src/worker/runTask.js:L74@handleLines(splitter.push(String(d)));`.
4. Отправляет прогресс не чаще раза в 3 секунды, а последнее сообщение доотправляет при завершении: `server/src/worker/runTask.js:L64@if (now - lastSent >= PROGRESS_THROTTLE_MS)`.
5. При закрытии процесса снимает таймер, снимает регистрацию и отдаёт причину остановки: `server/src/worker/runTask.js:L87@const entry = unregisterRun(taskId);`.

## Ошибки и граничные случаи
- Ошибка запуска (например, нет бинарника `claude`) приходит как событие `error` процесса и отклоняет промис: `server/src/worker/runTask.js:L77@child.on('error'`. Её ловит `runTask`.
- Таймер очищается и при ошибке, и при закрытии, поэтому не остаётся висящих таймеров.
- stderr копится целиком в памяти без ограничения. Для обычных запусков объём мал, но длинный лог может занять место. Лог в задаче обрезается до 20 000 символов уже в `runTask`.

## Связи
- Разбор строк: `docs/functions/server/progress/progressFromEvent.md:L3#Назначение`.
- Реестр: `docs/functions/server/worker/stopRun.md:L3#Назначение`.
- Прогресс: `docs/architecture/stream-progress.md:L11#Троттлинг`.
