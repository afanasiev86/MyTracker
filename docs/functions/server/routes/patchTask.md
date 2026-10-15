# PATCH /api/tasks/:id

## Назначение
Ручное изменение задачи: поля, ручная смена статуса по правилам переходов и позиция на доске (`order`, см. раздел «Доска» в `docs/features/tasks-and-runs.md`). Запуск и отмена сюда не относятся, у них свои маршруты.

## Где объявлено
Маршрут (тонкий, только HTTP): `server/src/routes/tasks/patchTask.js:L6-13#patchTask`.
Правила: `server/src/services/tasks/patchTask.js:L8-28#patchTask`.

## Вход и выход
- Вход: тело запроса по схеме `updateSchema` (`server/src/routes/tasks/schemas.js:L21-25#updateSchema`).
- Выход: `200` с задачей; `400` при неверных данных; `404` если задачи нет; `409` при запрещённом переходе.

## Алгоритм
1. Валидирует тело и нормализует поля в маршруте: `server/src/routes/tasks/patchTask.js:L8@const patch = normalize(updateSchema.parse(req.body));`.
2. Если меняется проект, проверяет, что он существует: `server/src/services/tasks/patchTask.js:L13@await assertProjectExists(patch.project);`.
3. Статус `in_progress` вручную не ставится, это делает только запуск: `server/src/services/tasks/patchTask.js:L18@Статус «В работе» ставится только запуском задачи`.
4. Остальные переходы проверяются таблицей: `server/src/services/tasks/patchTask.js:L20@if (!canTransition(task.status, patch.status))`. Правила: `docs/architecture/run-pipeline.md:L61#Состояния задачи`.
5. Сохраняет задачу и возвращает её: `server/src/services/tasks/patchTask.js:L25@Object.assign(task, patch);`.

## Ошибки и граничные случаи
- Проверка перехода и сохранение не атомарны: между ними задачу может изменить воркер. Для ручных статусов это не опасно, потому что воркер не ставит `review` вручную, но это место для оптимистичной блокировки, если понадобится.
- Маршрут не знает о моделях: все запросы идут через `server/src/services/store/tasks.js`. Так правило из `CLAUDE.md` («routes без бизнес-логики») соблюдается.

## Связи
- Клиент: ``client/src/api/tasks.js:L6-7#updateTask``.
- Статусы: `docs/architecture/run-pipeline.md:L61#Состояния задачи`.
