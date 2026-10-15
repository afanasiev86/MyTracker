# Прогресс запуска (поток stream-json)

Кратко: Claude пишет события построчно, воркер берёт текущий шаг и сохраняет его в задачу, карточка опрашивает задачу раз в 4 секунды.

## Разбор событий
Строка → событие: parseStreamLine (`docs/functions/server/progress/parseStreamLine.md:L3#Назначение`). Строка прогресса: progressFromEvent (`docs/functions/server/progress/progressFromEvent.md:L13#Алгоритм`). Разбиение на строки: LineSplitter (`docs/functions/server/progress/LineSplitter.md:L3#Назначение`).

## Запись прогресса
Поле `progress` модели `server/src/models/Task.js:L31-66#taskSchema`. Записи идут по очереди, чтобы не перетереть финальный статус: `server/src/worker/runTask.js:L55@writes = writes.then`.

## Троттлинг
Не чаще раза в 3 секунды: `server/src/worker/claudeProcess.js:L9@PROGRESS_THROTTLE_MS`. Последнее сообщение доотправляется при завершении.

## Итоговое событие
Результат, стоимость и `session_id` берутся из последнего события `result`: findResult (`docs/functions/server/progress/findResult.md:L13#Алгоритм`).
