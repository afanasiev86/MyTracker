# Конвейер запуска задачи

Кратко: задача уходит в Claude через очередь проекта, Claude работает в отдельной рабочей копии git, результат попадает в статус и в Telegram. Функции: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

## Этапы запуска
1. Пользователь запускает задачу: API, бот или кнопка. Всё сходится в `server/src/services/runs.js:L7-15#startTask`.
2. Задача ставится в очередь проекта `server/src/worker/queue.js:L14-25#enqueue`. Подробнее: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).
3. Воркер готовит рабочую копию prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).
4. Запускается `claude` с инструментами из claudeTools (`docs/functions/server/worker/claudeTools.md:L13#Алгоритм`) через runClaude (`docs/functions/server/worker/runClaude.md:L13#Алгоритм`).
5. По итогу выбирается исход (таблица ниже) и уведомление уходит в Telegram.

## Исходы запуска
Порядок проверок важен: первое совпавшее условие определяет статус. Таблица со ссылками на строки: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

## Рабочая копия
Каждая задача получает ветку `task/<id>` и отдельный git worktree в `WORKTREES_DIR`. Продолжение после вопроса берёт ветку из origin: prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).

## Очередь
Очередь только в памяти, по ключу проекта. Задачи одного репозитория идут по очереди. Детали: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).

## Отмена и таймаут
Оба случая отправляют SIGTERM через реестр процессов: `server/src/worker/processes.js:L22-34#stopRun`. Причина (`cancelled` или `timeout`) определяет исход. Известное ограничение: нет SIGKILL, см. stopRun (`docs/functions/server/worker/stopRun.md:L18#Ошибки и граничные случаи`).

## Состояния задачи
Таблица статусов и переходов: `shared/statuses.js:L24-32#TRANSITIONS`. Ручные переходы проверяет `server/src/routes/tasks.js:L90-117#PATCH /:id` (подробно (`docs/functions/server/routes/patchTask.md:L13#Алгоритм`)).
