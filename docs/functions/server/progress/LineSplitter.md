# LineSplitter

## Назначение
Собирает полные строки из кусков stdout. Кусок может обрываться посреди строки, и без буфера JSON разбирался бы неверно.

## Где объявлено
`server/src/worker/progress.js:L53-70#LineSplitter`

## Вход и выход
- Методы: `push(chunk)` возвращает полные строки; `flush()` возвращает хвост без перевода строки в конце процесса.

## Алгоритм
1. Конструктор создаёт пустой буфер: `server/src/worker/progress.js:L55@this.buffer = '';`.
2. `push` добавляет кусок, делит по переводам строк и последний (неполный) кусок оставляет в буфере: `server/src/worker/progress.js:L61@this.buffer = parts.pop();`.
3. `flush` отдаёт остаток, если он есть, и очищает буфер: `server/src/worker/progress.js:L66@const rest = this.buffer;`.

## Ошибки и граничные случаи
- Буфер растёт, пока не придёт перевод строки. Для потока `stream-json` строки короткие, поэтому проблем нет.
- Без `flush` последнее событие, пришедшее без перевода строки, потерялось бы. `runClaude` вызывает его при закрытии: `server/src/worker/runTask.js:L85@handleLines(splitter.flush());`.

## Связи
- Подход: `docs/architecture/stream-progress.md:L5#Разбор событий`.
