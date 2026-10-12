# findResult

## Назначение
Находит итоговое событие `result` в полном stdout. Из него воркер берёт `session_id`, стоимость, итоговый текст и признак ошибки.

## Где объявлено
`server/src/worker/progress.js:L43-50#findResult`

## Вход и выход
- Вход: `stdout` — весь вывод процесса.
- Выход: объект события `result` или `null`.

## Алгоритм
1. Делит вывод на строки: `server/src/worker/progress.js:L44@const lines = stdout.split('\n');`.
2. Идёт с конца, потому что итоговое событие стоит последним: `server/src/worker/progress.js:L45@for (let i = lines.length - 1`.
3. Возвращает первое найденное событие с `type: 'result'`: `server/src/worker/progress.js:L47@if (event?.type === 'result') return event;`.

## Ошибки и граничные случаи
- Если процесс упал до итогового события, `findResult` вернёт `null`. Тогда `runTask` ориентируется на код выхода: `server/src/worker/runTask.js:L183@} else if (res.code !== 0 || data?.is_error)`.
- Поиск с конца быстрый даже на длинном выводе, потому что обычно результат в последней строке.

## Связи
- Подход: `docs/architecture/stream-progress.md:L14#Итоговое событие`.
