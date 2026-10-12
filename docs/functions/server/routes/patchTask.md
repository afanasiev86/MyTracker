# PATCH /api/tasks/:id

## Назначение
Ручное изменение задачи: поля и ручная смена статуса по правилам переходов. Запуск и отмена сюда не относятся, у них свои маршруты.

## Где объявлено
`server/src/routes/tasks.js:L90-117#PATCH /:id`

## Вход и выход
- Вход: тело запроса по схеме `updateSchema` (`server/src/routes/tasks.js:L27-30#updateSchema`).
- Выход: `200` с задачей; `400` при неверных данных; `404` если задачи нет; `409` при запрещённом переходе.

## Алгоритм
1. Валидирует тело и нормализует поля: `server/src/routes/tasks.js:L92@const patch = normalize(updateSchema.parse(req.body));`.
2. Если меняется проект, проверяет, что он существует: `server/src/routes/tasks.js:L97@await assertProjectExists(patch.project);`.
3. Статус `in_progress` вручную не ставится, это делает только запуск: `server/src/routes/tasks.js:L102@Статус «В работе» ставится только запуском задачи`.
4. Остальные переходы проверяются таблицей: `server/src/routes/tasks.js:L104@if (!canTransition(task.status, patch.status))`. Правила: `docs/architecture/run-pipeline.md:L24#Состояния задачи`.
5. Сохраняет задачу и возвращает её: `server/src/routes/tasks.js:L111@Object.assign(task, patch);`.

## Ошибки и граничные случаи
- Проверка перехода и сохранение не атомарны: между ними задачу может изменить воркер. Для ручных статусов это не опасно, потому что воркер не ставит `review` вручную, но это место для оптимистичной блокировки, если понадобится.
- Здесь нет бизнес-логики запуска, поэтому маршрут тонкий, как требует `CLAUDE.md`. Правила переходов вынесены в `shared/statuses.js`.

## Связи
- Клиент: ``client/src/api.js:L63-64#updateTask``.
- Статусы: `docs/architecture/run-pipeline.md:L24#Состояния задачи`.
