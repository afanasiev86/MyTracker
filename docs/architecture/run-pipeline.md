# Конвейер запуска задачи

Кратко: задача уходит в Claude через очередь проекта, Claude работает в отдельной рабочей копии git, результат попадает в статус и в Telegram. Функции: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

## Этапы запуска
1. Пользователь запускает задачу: API, бот или кнопка. Всё сходится в `server/src/services/runs/startTask.js:L5-15#startTask`.
2. Задача ставится в очередь проекта `server/src/worker/queue/enqueue.js:L6-17#enqueue`. Подробнее: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).
3. Воркер готовит рабочую копию prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).
4. Запускается `claude` с инструментами из claudeTools (`docs/functions/server/worker/claudeTools.md:L13#Алгоритм`) через runClaude (`docs/functions/server/worker/runClaude.md:L13#Алгоритм`).
5. По итогу выбирается исход (таблица ниже) и уведомление уходит в Telegram.

## Исходы запуска
Порядок проверок важен: первое совпавшее условие определяет статус. Таблица со ссылками на строки: runTask (`docs/functions/server/worker/runTask.md:L13#Алгоритм`).

**Лимит подписки** определяется только по упавшему запуску и только по тексту ошибки (итог запуска, stderr): `server/src/worker/limits.js:L13-16#isLimitError`. Весь вывод Claude для этого не проверяется: в нём всё, что он прочитал и написал, и слова «rate limit» или «лимит» встречаются в обычном коде, из-за чего успешный запуск принимался за лимит, коммиты терялись, а задача возвращалась в «Готово к работе». Регрессия закрыта сквозным тестом `server/test/runTask.e2e.test.js` (подставной `claude`, настоящий git).

**Имя автора git.** Перед созданием рабочей копии воркер задаёт `user.name` и `user.email` в репозитории проекта, если их нет нигде: `server/src/worker/worktree.js:L6-10#ensureGitIdentity`. Без этого `git commit` и `git rebase` на свежем сервере падают с «Committer identity unknown».

**Автопроверка** (перед «На проверке»): после пуша воркер запускает `npm run test` и `npm run lint`, если они объявлены в `package.json` проекта. Зависимости ставятся один раз в рабочую копию. Результат пишется системным комментарием «Автопроверка: …», хвосты вывода — в лог запуска, а в уведомлении есть строка с итогом. Статус от результата не меняется: решение за владельцем. Код: `server/src/worker/verify/runChecks.js:L8-22#runChecks`, вызов в `server/src/worker/outcome.js:L69@runChecks(wt)`. Тесты: `server/test/verify.test.js:L13@describe('автопроверка`.

## Рабочая копия
Каждая задача получает ветку `task/<id>` и отдельный git worktree в `WORKTREES_DIR`. Куда уходит результат, задаёт флажок проекта «Коммитить сразу в основную ветку» (`commitToBase`, настройки читает `server/src/services/projects/baseBranch.js:L6-12#branchSettings`):
- **Выключен (по умолчанию):** воркер пушит коммиты в ветку `task/<id>`, в основную ветку их нужно влить самому.
- **Включён:** воркер перекладывает коммиты поверх свежей основной ветки (`git rebase`) и пушит прямо в неё: `server/src/worker/publish.js:L27-48#publishToBase`. Если её успели обновить между вытягиванием и пушем, попытка повторяется один раз. Ветка `task/<id>` на GitHub в итоге удаляется. При конфликте или отклонённом пуше (защищённая ветка, нет прав) основная ветка не меняется, работа сохраняется в `task/<id>` (принудительный пуш в эту ветку: она только наша), статус «Ошибка» с причиной, дальше работает кнопка «Попросить Claude исправить». Автопроверка идёт уже после отправки и статус не меняет. В карточке полем «Ветка» показана основная ветка, а diff строится по коммитам запуска (`Task.diffRange`): `server/src/services/diff.js:L8-15#taskDiff`.
- Claude сам не пушит ни в каком режиме: он только коммитит в локальную ветку. Продолжение после вопроса берёт ветку из origin: prepareWorktree (`docs/functions/server/worker/prepareWorktree.md:L13#Алгоритм`).

## Аккаунт Claude
Если на аккаунте Claude, залогиненном на сервере, закончился лимит, запуски можно переключить на другой аккаунт
без доступа к серверу: карточка «Claude» в «Настройках» (`client/src/components/ClaudeSettings.jsx`) принимает
метку, тип (API-ключ или долгоживущий токен `claude setup-token`) и сам ключ. У Anthropic нет общего «whoami» ни
для ключа, ни для токена, поэтому в отличие от GitHub он не проверяется запросом к сети — только сохраняется.
Хранение зеркалит GitHub: токен зашифрован в `Settings` (`server/src/services/claude/settings.js`), маршруты
`GET/PUT/DELETE /api/claude` (`server/src/routes/claude.js`). Подстановка в окружение процесса `claude`:
`server/src/worker/env.js:L37-44#claudeEnv` — без сохранённого аккаунта окружение не меняется (аккаунт сервера),
с сохранённым подставляет `ANTHROPIC_API_KEY` или `CLAUDE_CODE_OAUTH_TOKEN` вместо значения из окружения сервера.
Используется в `server/src/worker/runTask.js:L48@...claudeEnv()`, поэтому новый аккаунт действует для всех задач
сразу со следующего запуска. Отключение возвращает воркер к аккаунту сервера.

## Очередь
Очередь в памяти, по ключу проекта. Задачи одного репозитория идут по очереди. Ждущие запуски помечены в задаче (`queued`), поэтому после перезапуска они возвращаются в очередь: `server/src/services/runs/recoverRuns.js:L10@export async function recoverRuns`. Детали: enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`).

## Отмена и таймаут
Оба случая отправляют SIGTERM через реестр процессов: `server/src/worker/processes/stopRun.js:L6-18#stopRun`. Причина (`cancelled` или `timeout`) определяет исход. Если процесс не завершился за 10 секунд, идёт SIGKILL (`server/src/worker/processes/config.js:L2@KILL_AFTER_MS`), см. stopRun (`docs/functions/server/worker/stopRun.md:L13#Алгоритм`).

## Здоровье
Публичный `/api/health` отвечает 200 или 503 и показывает по каждому сервису (база, Claude Code, хранилище, Telegram) признак «в норме». Проверки кэшируются на 30 секунд: `server/src/services/health/getChecks.js:L11-28#getChecks`. Подробности для владельца (очередь по проектам, запуски, зависшие задачи «в работе» без процесса) собирает `server/src/services/health/details.js:L9-36#getDetails` и показывает блок «Состояние» в «Настройках».

## Состояния задачи
Таблица статусов и переходов: `shared/statuses.js:L24-32#TRANSITIONS`. Ручные переходы проверяет `server/src/routes/tasks/patchTask.js:L6-13#patchTask` (подробно (`docs/functions/server/routes/patchTask.md:L14#Алгоритм`)).

Инструкция запуска `/implement-task` лежит в репозитории трекера (`.claude/skills/implement-task`), а задача идёт в репозитории проекта. Поэтому перед запуском Claude воркер копирует её в рабочую копию (`server/src/worker/installSkill.js`), если у проекта своей нет, и исключает из git: в коммит она не попадает. Без неё Claude не находил команду, работал без плана и не делал коммит. Процесс claude запускается с закрытым stdin.
