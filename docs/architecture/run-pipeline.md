# Конвейер запуска задачи

Кратко: задача уходит в Claude через очередь проекта, Claude работает в отдельной рабочей копии git, результат попадает в статус и в Telegram. Функции: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

## Этапы запуска
1. Пользователь запускает задачу: API, бот или кнопка. Всё сходится в `server/src/services/runs/startTask.js:L6-14#startTask`.
2. Задача ставится в очередь проекта `server/src/worker/queue/enqueue.js:L6-17#enqueue`. Подробнее: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).
3. Воркер готовит рабочую копию prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).
4. Запускается `claude` с инструментами из claudeTools (`docs/functions/server/worker/claudeTools.md:L13#Алгоритм`) через runClaude (`docs/functions/server/worker/runClaude.md:L13#Алгоритм`).
5. По итогу выбирается исход (таблица ниже) и уведомление уходит в Telegram.

## Исходы запуска
Порядок проверок важен: первое совпавшее условие определяет статус. Таблица со ссылками на строки: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

**Автопроверка** (перед «На проверке»): после пуша воркер запускает `npm run test` и `npm run lint`, если они объявлены в `package.json` проекта. Зависимости ставятся один раз в рабочую копию. Результат пишется системным комментарием «Автопроверка: …», хвосты вывода — в лог запуска, а в уведомлении есть строка с итогом. Статус от результата не меняется: решение за владельцем. Код: `server/src/worker/verify/runChecks.js:L8-22#runChecks`, вызов в `server/src/worker/outcome.js:L48@runChecks(wt)`. Тесты: `server/test/verify.test.js:L12@describe('автопроверка`.

## Рабочая копия
Каждая задача получает ветку `task/<id>` и отдельный git worktree в `WORKTREES_DIR`. Продолжение после вопроса берёт ветку из origin: prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).

## Очередь
Очередь только в памяти, по ключу проекта. Задачи одного репозитория идут по очереди. Детали: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).

## Отмена и таймаут
Оба случая отправляют SIGTERM через реестр процессов: `server/src/worker/processes/stopRun.js:L6-18#stopRun`. Причина (`cancelled` или `timeout`) определяет исход. Если процесс не завершился за 10 секунд, идёт SIGKILL (`server/src/worker/processes/config.js:L2@KILL_AFTER_MS`), см. stopRun (`docs/functions/server/worker/stopRun.md:L13#Алгоритм`).

## Здоровье
Публичный `/api/health` отвечает 200 или 503 и показывает по каждому сервису (база, Claude Code, хранилище, Telegram) признак «в норме». Проверки кэшируются на 30 секунд: `server/src/services/health.js:L65-82#getChecks`. Подробности для владельца (очередь по проектам, запуски, зависшие задачи «в работе» без процесса) собирает `server/src/services/health.js:L94-121#getDetails` и показывает блок «Состояние» в «Настройках».

## Состояния задачи
Таблица статусов и переходов: `shared/statuses.js:L24-32#TRANSITIONS`. Ручные переходы проверяет `server/src/routes/tasks/patchTask.js:L7-34#patchTask` (подробно (`docs/functions/server/routes/patchTask.md:L13#Алгоритм`)).
