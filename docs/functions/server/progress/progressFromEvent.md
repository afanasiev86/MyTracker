# progressFromEvent

## Назначение
Превращает одно событие потока Claude в короткую строку «что сейчас делается». Строка показывается в карточке задачи.

## Где объявлено
`server/src/worker/progress/progressFromEvent.js:L5-15#progressFromEvent`

## Вход и выход
- Вход: `event` — объект события (результат `parseStreamLine`).
- Выход: строка до 300 символов или `null`, если событие не про работу.

## Алгоритм
1. Берёт только события ассистента, остальные пропускает: `server/src/worker/progress/progressFromEvent.js:L6@if (event?.type !== 'assistant') return null;`.
2. Идёт по блокам сообщения с конца, чтобы взять самый свежий шаг: `server/src/worker/progress/progressFromEvent.js:L9@for (let i = blocks.length - 1`.
3. Вызов инструмента описывается командой или файлом: `server/src/worker/progress/progressFromEvent.js:L11@if (block.type === 'tool_use') return short(describeTool(block));`.
4. Текст ассистента берётся, если он не пустой: `server/src/worker/progress/progressFromEvent.js:L12@if (block.type === 'text' && block.text?.trim())`.
5. Строка сводится к одной строке и обрезается: `server/src/worker/progress/short.js:L4@function short(text)`.

## Ошибки и граничные случаи
- Если в сообщении нет ни текста, ни вызовов, функция возвращает `null`, и прогресс не обновляется. Так мы не затираем последний осмысленный шаг пустыми событиями.
- Формат событий `stream-json` берётся из документации Claude Code CLI. Если формат изменится, прогресс перестанет обновляться, но сам запуск не сломается: итоговый результат читается отдельно.

## Связи
- Подход: `docs/architecture/stream-progress.md:L5#Разбор событий`.
- Разбор строки: `docs/functions/server/progress/parseStreamLine.md:L3#Назначение`.
