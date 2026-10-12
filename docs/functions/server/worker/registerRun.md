# registerRun

## Назначение
Добавляет запущенный процесс Claude в реестр, чтобы его можно было остановить по `taskId`.

## Где объявлено
`server/src/worker/processes/registerRun.js:L3-5#registerRun`

## Вход и выход
- Вход: `taskId`, `child` (процесс из `spawn`).
- Выход: нет.

## Алгоритм
1. Сохраняет запись `{ child, reason: null }` по строковому ID: `server/src/worker/processes/registerRun.js:L4@running.set(String(taskId), { child, reason: null });`.

## Ошибки и граничные случаи
- Ключ приводится к строке, потому что ObjectId и строка должны давать один и тот же ключ.
- Если для одной задачи зарегистрировать второй процесс, первый потеряется из реестра. В текущем коде на одну задачу одновременно идёт один процесс (это гарантирует очередь проекта).

## Связи
- Снятие регистрации: ``server/src/worker/processes/unregisterRun.js:L3-8#unregisterRun`` (см. строки в `server/src/worker/processes/unregisterRun.js:L3@unregisterRun`).
- Используется в `docs/functions/server/worker/runClaude.md:L13#Алгоритм`.
