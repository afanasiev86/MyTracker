# Функции: задачи, запуски, вопросы, проверка, стоимость

Для изменения этой области начинай с этого файла, затем открой ссылки.

## Задачи
Поля и статусы: `server/src/models/Task.js:L19-40#taskSchema`. Список статусов и переходы: `shared/statuses.js:L24-32#TRANSITIONS`. Создание и правка: `server/src/routes/tasks.js:L89-116#PATCH /:id` (подробно (`docs/functions/server/routes/patchTask.md:L13#Алгоритм`)).

## Запуск
Вход из API, бота и кнопок: startTask (`docs/functions/server/runs/startTask.md:L13#Алгоритм`). Конвейер: run-pipeline (`docs/architecture/run-pipeline.md:L5#Этапы запуска`).

## Вопросы от Claude
Claude сохраняет вопрос через API: POST /question (`docs/functions/server/routes/postQuestion.md:L13#Алгоритм`). Ответ владельца продолжает сессию: answerTask (`docs/functions/server/runs/answerTask.md:L13#Алгоритм`).

## Отмена
cancelTask (`docs/functions/server/runs/cancelTask.md:L13#Алгоритм`) и остановка процесса stopRun (`docs/functions/server/worker/stopRun.md:L13#Алгоритм`).

## Проверка и приём
Статус «На проверке» ставит воркер, принятие: acceptTask (`docs/functions/server/runs/acceptTask.md:L13#Алгоритм`). Diff: `server/src/services/diff.js:L5-10#taskDiff`.

## Стоимость
Суммы по запускам: `client/src/lib/cost.js:L3-5#sumRunCosts`, формат: `client/src/lib/cost.js:L7-9#formatUsd`. Агрегат по всем задачам: `server/src/routes/stats.js`.
