# Документация MyTracker: точка входа

Этот файл нужен, чтобы быстро понять, где что находится, перед любым изменением функционала.

## Правило для работы (читай первым)
1. Начни с таблицы «Что меняем» ниже и открой один тематический файл.
2. Дальше открывай ссылки на функции по необходимости. Не читай весь репозиторий.
3. **Не создавай новые документы** для описания изменений. Обнови существующий файл: раздел про функцию или строку в карте.
4. После правок кода или документов запусти `npm run docs:build`, затем `npm run docs:check`. Номера строк обновятся сами.

## Как устроены ссылки
Ссылки в документах пишутся якорями, а номера строк подставляет скрипт `scripts/docs/refs.mjs`:
- `путь/к/файлу.js#имяФункции` — объявление функции или маршрута; в результате `:Lнач-кон`.
- `путь/к/файлу.js@текст` — первая строка, содержащая текст; в результате `:Lnn`.
- `docs/файл.md#Заголовок` — заголовок документа; в результате `:Lnn`.

Так номера не устаревают вручную: `docs:check` падает, если файл изменился.

## Что меняем → где смотреть

| Задача | Файл с обзором | Ключевые функции |
|---|---|---|
| Статусы, создание, правка задач | features/tasks-and-runs.md (`docs/features/tasks-and-runs.md:L5#Задачи`) | PATCH /:id (`docs/functions/server/routes/patchTask.md:L3#Назначение`), статусы (`docs/architecture/run-pipeline.md:L68#Состояния задачи`) |
| Запуск Claude, очередь, исходы | architecture/run-pipeline.md (`docs/architecture/run-pipeline.md:L5#Этапы запуска`) | startTask (`docs/functions/server/runs/startTask.md:L3#Назначение`), runTask (`docs/functions/server/worker/runTask.md:L3#Назначение`) |
| Вопросы от Claude и ответы | features/tasks-and-runs.md (`docs/features/tasks-and-runs.md:L27#Вопросы от Claude`) | postQuestion (`docs/functions/server/routes/postQuestion.md:L3#Назначение`), answerTask (`docs/functions/server/runs/answerTask.md:L3#Назначение`) |
| Отмена и таймаут | architecture/run-pipeline.md (`docs/architecture/run-pipeline.md:L62#Отмена и таймаут`) | cancelTask (`docs/functions/server/runs/cancelTask.md:L3#Назначение`), stopRun (`docs/functions/server/worker/stopRun.md:L3#Назначение`) |
| Прогресс в карточке | architecture/stream-progress.md (`docs/architecture/stream-progress.md:L5#Разбор событий`) | progressFromEvent (`docs/functions/server/progress/progressFromEvent.md:L3#Назначение`), runClaude (`docs/functions/server/worker/runClaude.md:L3#Назначение`) |
| UAT-стенды (адрес, nginx, сертификат, логин, сборка, рецепт от Claude) | architecture/uat-stands.md (`docs/architecture/uat-stands.md:L13#Сборка стенда`) | ensureStand (`server/src/services/uat/ensureStand.js:L38-42#ensureStand`), deployStand (`server/src/services/uat/deployStand.js:L54-96#deployStand`), validateCompose (`server/src/services/uat/validateCompose.js:L19-67#validateCompose`), `.claude/skills/deploy-uat/SKILL.md` |
| Ограничение инструментов Claude | architecture/tool-restriction.md (`docs/architecture/tool-restriction.md:L5#Список инструментов`) | claudeTools (`docs/functions/server/worker/claudeTools.md:L3#Назначение`) |
| Переключение аккаунта Claude (при лимите) | architecture/run-pipeline.md (`docs/architecture/run-pipeline.md:L33#Аккаунт Claude`) | claudeEnv (`server/src/worker/env.js:L37-44#claudeEnv`), карточка `client/src/components/ClaudeSettings.jsx` |
| Вход, токены, отзыв | architecture/auth-tokens.md (`docs/architecture/auth-tokens.md:L5#Вход по паролю`) | verifyToken (`docs/functions/server/auth/verifyToken.md:L3#Назначение`), revokeAllTokens (`docs/functions/server/auth/revokeAllTokens.md:L3#Назначение`) |
| Подключение бота (токен, ID, Mini App) | features/telegram.md (`docs/features/telegram.md:L5#Подключение из интерфейса`) | `server/src/services/telegram/connect.js:L25-41#connectTelegram`, `server/src/services/telegram/runtime.js:L9-16#getTelegramConfig` |
| Управление сервером (сервисы, журналы, обновление) | features/telegram.md (`docs/features/telegram.md:L12#Управление сервером`) | `server/src/services/ops/control.js:L24-44#controlService`, `deploy/update.sh`, `deploy/ops-setup.sh:L12@sudoers` |
| Telegram: команды, уведомления | features/telegram.md (`docs/features/telegram.md:L21#Команды бота`) | handleCommand (`docs/functions/server/bot/handleCommand.md:L3#Назначение`), notify (`docs/functions/server/telegram/notify.md:L3#Назначение`) |
| Кнопки под проверкой | architecture/telegram-transport.md (`docs/architecture/telegram-transport.md:L8#Кнопки под проверкой`) | handleCallback (`docs/functions/server/bot/handleCallback.md:L3#Назначение`), reviewKeyboard (`docs/functions/server/bot/reviewKeyboard.md:L3#Назначение`) |
| Дайджест 09:00 | architecture/telegram-transport.md (`docs/architecture/telegram-transport.md:L11#Дайджест`) | buildDigest (`docs/functions/server/digest/buildDigest.md:L3#Назначение`), startDigestScheduler (`docs/functions/server/digest/startDigestScheduler.md:L3#Назначение`) |
| Mini App | features/telegram.md (`docs/features/telegram.md:L33#Mini App`) | verifyInitData (`docs/functions/server/telegram/verifyInitData.md:L3#Назначение`) |
| Клиенты и проекты (CRM) | features/crm-and-auth.md (`docs/features/crm-and-auth.md:L3#Клиенты и проекты`) | маршруты в `server/src/routes/clients.js`, `server/src/routes/projects.js` |
| Стоимость | features/tasks-and-runs.md (`docs/features/tasks-and-runs.md:L39#Стоимость`) | `client/src/lib/cost.js:L3-5#sumRunCosts` |
| Здоровье сервисов и запусков | architecture/run-pipeline.md (`docs/architecture/run-pipeline.md:L5#Этапы запуска`), раздел «Здоровье» | getChecks (`server/src/services/health/getChecks.js:L11-28#getChecks`), getDetails (`server/src/services/health/details.js:L9-36#getDetails`), блок в интерфейсе `client/src/components/Health.jsx:L10-36#Health` |
| Бэкапы и восстановление | `docs/RUNBOOK.md:L176#Восстановление после потери данных` | проверка архива: `deploy/restore-mongo.sh:L46@restore_into()`; копия вложений: `deploy/backup-uploads.sh:L21@tar -czf` |
| Экран задачи в интерфейсе | `client/src/components/TaskDetail.jsx:L34-166#TaskDetail`; доска: раздел «Доска» в `docs/features/tasks-and-runs.md` | главная кнопка Telegram: `client/src/lib/telegram/mainButton.js:L5-19#setMainButton` |
| Адреса страниц и форм (роутинг) | раздел «Адреса интерфейса» ниже | маршруты владельца `client/src/app/OwnerView.jsx:L19-54#OwnerView`, вход и роли `client/src/App.jsx:L12-95#App`, вкладки `client/src/app/SectionTabs.jsx:L6-19#SectionTabs` |

## Адреса интерфейса
Роутер: react-router-dom, `BrowserRouter` в `client/src/main.jsx:L3@BrowserRouter`. Каждая страница и каждая форма/карточка (панель поверх списка) имеет свой адрес. Прод-nginx отдаёт `index.html` на любой путь (`deploy/nginx.conf:L25@try_files`).

| Адрес | Что открывает |
|---|---|
| `/login` | вход; неавторизованного с любого адреса перекидывает сюда и после входа возвращает на исходный |
| `/tasks` | доска задач (владелец) |
| `/tasks/new` | форма новой задачи |
| `/tasks/:id` | карточка задачи |
| `/projects`, `/projects/new`, `/projects/:id` | список, форма создания, форма редактирования проекта |
| `/clients`, `/clients/new`, `/clients/:id` | то же для клиентов |
| `/settings` | здоровье сервисов и настройка Telegram-бота |
| `/portal` | портал заказчика (роль client) |

Форма/карточка рендерится через `<Outlet>` внутри страницы списка, поэтому фильтры доски не сбрасываются при открытии задачи. Компоненты маршрутов: `client/src/components/board/TaskRoutes.jsx:L28-38#TaskRoute`, `client/src/components/projects/ProjectRoute.jsx:L6-36#ProjectRoute`, `client/src/components/clients/ClientRoute.jsx:L6-36#ClientRoute`. Неизвестный путь ведёт на `/tasks` (владелец) или `/portal` (заказчик). Кнопка «Назад» в Telegram закрывает задачу: `client/src/components/Board.jsx:L8@useBackButton`.

## Интерфейс: Ant Design
Тема и русская локаль: `client/src/main.jsx:L4@ConfigProvider`. Локаль импортируется из `antd/es/locale/ru_RU`: путь `antd/locale/ru_RU` Vite отдаёт с лишним `default`, и локаль молча не применяется (даты остаются на английском).
- Формы хранят значения в `useState`, а не в сторе `Form`: обработчик поля `client/src/lib/fieldValue.js:L5-6#fieldSetter` принимает и событие Input, и значение Select/DatePicker. Даты в состоянии строкой `YYYY-MM-DD`.
- Подпись связана с полем через `client/src/components/Field.jsx:L5-12#Field` (у `Form.Item` без `name` связи нет), поэтому поиск по подписи в тестах работает.
- Подтверждения (`confirmAction`) остались нативными: в Telegram это системное окно.
- Тесты клиента: заглушки `matchMedia`, `ResizeObserver`, `DOMMatrixReadOnly` в `client/src/test/setup.js`.

## Функции (детально, по одной на файл)
- Авторизация: checkPassword (`docs/functions/server/auth/checkPassword.md:L3#Назначение`), issueToken (`docs/functions/server/auth/issueToken.md:L3#Назначение`), currentTokenVersion (`docs/functions/server/auth/currentTokenVersion.md:L3#Назначение`), verifyToken (`docs/functions/server/auth/verifyToken.md:L3#Назначение`), revokeAllTokens (`docs/functions/server/auth/revokeAllTokens.md:L3#Назначение`), requireAuth (`docs/functions/server/auth/requireAuth.md:L3#Назначение`)
- HTTP: createApp (`docs/functions/server/http/createApp.md:L3#Назначение`), errorHandler (`docs/functions/server/http/errorHandler.md:L3#Назначение`)
- Маршруты: PATCH /:id (`docs/functions/server/routes/patchTask.md:L3#Назначение`), POST /:id/question (`docs/functions/server/routes/postQuestion.md:L3#Назначение`)
- Запуски: startTask (`docs/functions/server/runs/startTask.md:L3#Назначение`), answerTask (`docs/functions/server/runs/answerTask.md:L3#Назначение`), cancelTask (`docs/functions/server/runs/cancelTask.md:L3#Назначение`), acceptTask (`docs/functions/server/runs/acceptTask.md:L3#Назначение`)
- Воркер: runTask (`docs/functions/server/worker/runTask.md:L3#Назначение`), runClaude (`docs/functions/server/worker/runClaude.md:L3#Назначение`), prepareWorkdir (`docs/functions/server/worker/prepareWorkdir.md:L3#Назначение`), claudeTools (`docs/functions/server/worker/claudeTools.md:L3#Назначение`), enqueue (`docs/functions/server/worker/enqueue.md:L3#Назначение`), stopRun (`docs/functions/server/worker/stopRun.md:L3#Назначение`), registerRun (`docs/functions/server/worker/registerRun.md:L3#Назначение`), isLimitError (`docs/functions/server/worker/isLimitError.md:L3#Назначение`)
- Прогресс: progressFromEvent (`docs/functions/server/progress/progressFromEvent.md:L3#Назначение`), parseStreamLine (`docs/functions/server/progress/parseStreamLine.md:L3#Назначение`), findResult (`docs/functions/server/progress/findResult.md:L3#Назначение`), LineSplitter (`docs/functions/server/progress/LineSplitter.md:L3#Назначение`)
- Telegram: telegramApi (`docs/functions/server/telegram/telegramApi.md:L3#Назначение`), telegramEnabled (`docs/functions/server/telegram/telegramEnabled.md:L3#Назначение`), sendTelegram (`docs/functions/server/telegram/sendTelegram.md:L3#Назначение`), notify (`docs/functions/server/telegram/notify.md:L3#Назначение`), verifyInitData (`docs/functions/server/telegram/verifyInitData.md:L3#Назначение`)
- Бот: handleCommand (`docs/functions/server/bot/handleCommand.md:L3#Назначение`), startPolling (`docs/functions/server/bot/startPolling.md:L3#Назначение`), handleButton (`docs/functions/server/bot/handleButton.md:L3#Назначение`), handleCallback (`docs/functions/server/bot/handleCallback.md:L3#Назначение`), showDiff (`docs/functions/server/bot/showDiff.md:L3#Назначение`), encodeCallback (`docs/functions/server/bot/encodeCallback.md:L3#Назначение`), decodeCallback (`docs/functions/server/bot/decodeCallback.md:L3#Назначение`), reviewKeyboard (`docs/functions/server/bot/reviewKeyboard.md:L3#Назначение`)
- Дайджест: buildDigest (`docs/functions/server/digest/buildDigest.md:L3#Назначение`), moscowParts (`docs/functions/server/digest/moscowParts.md:L3#Назначение`), startDigestScheduler (`docs/functions/server/digest/startDigestScheduler.md:L3#Назначение`)

## Известные проблемы (проверено по коду)
- Реестр процессов в памяти: после перезапуска запущенный процесс Claude не виден. Выполнявшиеся запуски помечаются ошибкой. Ждавшие в очереди возвращаются (см. `docs/architecture/run-pipeline.md:L59#Очередь`).
- Поток `stream-json` и итоговое событие `result` не проверены на реальном запуске `claude`.
- Вложения: см. [tasks-and-runs](docs/features/tasks-and-runs.md#Вложения).

## Тесты
Серверные: `server/test/` (без базы запускаются `unit`, `progress`, `bot`, `app`, `telegramAuth`; с `MONGO_URL_TEST` — `*.db.test.js`). Клиентские: `client/src/**/*.test.jsx`, `client/src/api.test.js`.
