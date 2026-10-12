# POST /api/tasks/:id/question

## Назначение
Сохраняет вопрос, который Claude задал во время работы. Так вопрос попадает в трекер и в Telegram, а воркер после завершения процесса переводит задачу в «Нужен ответ».

## Где объявлено
Маршрут: `server/src/routes/tasks/questionRoute.js:L5-15#questionRoute`.
Правила: `server/src/services/tasks/askQuestion.js:L5-14#askQuestion`.

## Вход и выход
- Вход: `{ text }` по схеме `textSchema` (`server/src/routes/tasks/schemas.js:L27-27#textSchema`).
- Выход: `201 { ok: true }`; `404` если задачи нет; `409`, если задача не в работе.

## Алгоритм
1. Проверяет текст в маршруте: `server/src/routes/tasks/questionRoute.js:L7@const { text } = textSchema.parse(req.body);`.
2. Разрешает вопрос только в статусе «В работе»: `server/src/services/tasks/askQuestion.js:L9@Вопрос можно задать только во время работы`.
3. Записывает `pendingQuestion` и сохраняет: `server/src/services/tasks/askQuestion.js:L11@task.pendingQuestion = text;`.

## Ошибки и граничные случаи
- Вызывается самим Claude через `deploy/tracker-api.sh` по инструкции из skill `implement-task`: `.claude/skills/implement-task/SKILL.md`.
- Сам статус здесь не меняется. Перевод в «Нужен ответ» делает воркер в `server/src/worker/outcome.js:L41@return { status: 'waiting'`, иначе задача могла бы стать «ожидающей» без процесса.
- Если Claude задал вопрос, а потом упал, `pendingQuestion` очищается в `server/src/worker/runTask.js:L92@if (outcome.status !== 'waiting') task.pendingQuestion = ''`.

## Связи
- Поток вопросов: `docs/features/tasks-and-runs.md:L13#Вопросы от Claude`.
- Ответ владельца: `docs/functions/server/runs/answerTask.md:L3#Назначение`.
