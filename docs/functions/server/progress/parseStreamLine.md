# parseStreamLine

## Назначение
Разбирает одну строку stdout потока Claude. Пустые строки и не-JSON строки не ломают воркер.

## Где объявлено
`server/src/worker/progress.js:L32-40#parseStreamLine`

## Вход и выход
- Вход: `line` — строка без перевода строки.
- Выход: объект события или `null`.

## Алгоритм
1. Обрезает пробелы и отсекает строки, которые не начинаются с `{`: `server/src/worker/progress.js:L34@if (!trimmed.startsWith('{')) return null;`.
2. Парсит JSON, ошибку парсинга ловит и возвращает `null`: `server/src/worker/progress.js:L36@return JSON.parse(trimmed);`.

## Ошибки и граничные случаи
- Строки, начинающиеся с `{`, но не являющиеся JSON, тоже дают `null` (блок `catch`).
- Сообщения вида «Starting…» или другой текст, который Claude может выводить вне JSON, тихо пропускаются.

## Связи
- Используется в `docs/functions/server/worker/runClaude.md:L13#Алгоритм` и `docs/functions/server/progress/findResult.md:L3#Назначение`.
