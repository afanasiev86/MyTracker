# Функции: задачи, запуски, вопросы, проверка, стоимость

Для изменения этой области начинай с этого файла, затем открой ссылки.

## Задачи
Поля и статусы: `server/src/models/Task.js:L31-61#taskSchema`. Список статусов и переходы: `shared/statuses.js:L24-32#TRANSITIONS`. Создание и правка: `server/src/routes/tasks/patchTask.js:L6-13#patchTask` (подробно (`docs/functions/server/routes/patchTask.md:L14#Алгоритм`)).

**Тип задачи** (`kind`: баг, фича, рефакторинг, без типа). Выставляется выбором шаблона или полем «Тип задачи» в форме, значения в `shared/taskKinds.js`. Claude получает тип из `GET /tasks/:id` и выбирает порядок работы по разделу «Типы задач» в `.claude/skills/implement-task/SKILL.md`. В промпт запуска тип не передаётся: аргумент команды используется для ID.

## Доска
Канбан 1 в 1 по образцу `../kanban_only` (механизм описан в его `docs/KANBAN_MECHANISM.md`): перетаскивание на pointer events, FLIP-анимация, авто-скролл у края. Папка `client/src/kanban/` повторяет структуру образца, файлы `drag/`, `hooks/` и компоненты совпадают с ним байт в байт, кроме двух правок. `Card.jsx`: добавлен вывод `card.content`, чтобы в карточке была не только строка. `drag/useDragController.js`: сохранение переноса (`commitDrag`) вызывается из обработчика отпускания, а не внутри функции-обновления `setDrag`. В образце сохранение шло внутри обновления, поэтому состояние данных менялось на следующем рендере: карточки на миг возвращались на старые места и анимировались заново (на ±50 px, хотя порядок уже верный), а в dev-режиме StrictMode перенос вызывался дважды. Остальные файлы не правьте, при обновлении образца копируйте заново и повторяйте эти две правки. Страница: `client/src/components/Board.jsx:L15-93#Board`, колонки по статусам: `client/src/components/board/buildBoards.js:L7-22#buildBoards`.

- Карточку можно ставить на любую позицию любой колонки, как в образце. Расчёт переноса: `client/src/components/board/planMove.js:L9-23#planMove`, он вызывает `moveCard` из образца.
- Позиция хранится в поле `order` задачи (`server/src/models/Task.js:L45@order:`), правила ключа и вставки между соседями: `shared/taskOrder.js:L3-3#orderKey`, `shared/taskOrder.js:L10-15#orderBetween`. Без `order` задача сортируется по `updatedAt` (новые выше), поэтому старые данные не требуют миграции. Сервер сортирует список тем же `sortByOrder`: `server/src/services/store/tasks.js:L14-17#listTasks`. `order` ставится через PATCH вместе со статусом.
- Перенос в другую колонку меняет статус по правилам `shared/statuses.js:L24-32#TRANSITIONS`. Образец принимает карточку в любую колонку, поэтому проверка сделана после броска: в запрещённую колонку карточка не переходит, остаётся на месте, над доской показывается причина. Сам механизм драга для этого не менялся.
- Карточка сразу встаёт на новое место (`client/src/components/board/useBoardData.js:L9-20#useBoardData`), при ошибке список перечитывается и показывается сообщение сервера.
- Клик по карточке (жест без смещения за порог) открывает окно `/tasks/:id`, кнопка «Новая задача» — `/tasks/new`. Окно — `Modal` из antd: `client/src/components/board/TaskRoutes.jsx:L28-38#TaskRoute`.
- Внешний вид: те же имена классов и размеры, что в образце (`client/src/styles.css@.boards-wrap`), цвета из токенов antd через CSS-переменные на `.kanban-host`. Высоту доска берёт у `.kanban-host`; цепочка `flex` и `min-height: 0` до `.board-cards` не должна прерываться.
- Известные отличия от образца: нет перехода по Enter с клавиатуры (в образце его нет), у колонок есть счётчик карточек.

## Карточка задачи (окно)
Собирается в `client/src/components/TaskDetail.jsx:L31-160#TaskDetail` из блоков `client/src/components/task/`: шапка `client/src/components/task/TaskHeader.jsx:L9-30#TaskHeader` (цветная полоса по статусу: `client/src/components/task/statusMeta.js:L2-10#STATUS_COLORS`), справа панель `client/src/components/task/TaskSidebar.jsx:L9-36#TaskSidebar` (главное действие сверху, затем остальные и реквизиты), слева описание и вкладки «Комментарии», «Запуски», «Скриншоты». Вопрос Claude и ход работы показываются над описанием, потому что требуют реакции. Раскладка и стили: `client/src/styles.css@.task-layout`; на узком экране панель идёт сразу под шапкой, а реквизиты скрыты (они дублируют шапку).

## Запуск
Вход из API, бота и кнопок: startTask (`docs/functions/server/runs/startTask.md:L13#Алгоритм`). Конвейер: run-pipeline (`docs/architecture/run-pipeline.md:L5#Этапы запуска`).

## Вопросы от Claude
Claude сохраняет вопрос через API: POST /question (`docs/functions/server/routes/postQuestion.md:L14#Алгоритм`). Ответ владельца продолжает сессию: answerTask (`docs/functions/server/runs/answerTask.md:L13#Алгоритм`).

## Отмена
cancelTask (`docs/functions/server/runs/cancelTask.md:L13#Алгоритм`) и остановка процесса stopRun (`docs/functions/server/worker/stopRun.md:L13#Алгоритм`).

## Проверка и приём
Статус «На проверке» ставит воркер, принятие: acceptTask (`docs/functions/server/runs/acceptTask.md:L13#Алгоритм`). Diff: `server/src/services/diff.js:L6-11#taskDiff`.

## Стоимость
Суммы по запускам: `client/src/lib/cost.js:L3-5#sumRunCosts`, формат: `client/src/lib/cost.js:L7-9#formatUsd`. Агрегат по всем задачам: `server/src/routes/stats.js`.

## Вложения
Скриншоты к задаче (PNG, JPEG, GIF, WebP до 5 МБ). Файлы лежат на диске сервера в папке `ATTACHMENTS_DIR` (по умолчанию `uploads/` рядом с `server/`, в git не попадает), по одной подпапке на задачу. Запись и чтение: `server/src/services/storage/files.js:L9-13#putFile`. В базе только метаданные: имя файла (ключ `<id задачи>/<uuid>.<расширение>`), тип и размер.
- Загрузка: `POST /api/tasks/:id/attachments`, тело — сам файл. Маршрут: `server/src/routes/tasks.js:L28@'/:id/attachments'`. Логика: `server/src/services/attachments/saveAttachment.js:L6-14#saveAttachment`. Проверка типа и размера: `server/src/services/attachments/validate.js:L6-12#checkAttachment`.
- Отдача: `GET /api/tasks/:id/attachments/:attachmentId` отдаёт поток файла с диска; прямой ссылки на папку нет, доступ только через API с токеном. Логика: `server/src/services/attachments/attachmentStream.js:L4-8#attachmentStream`.
- Проверка здоровья: папка создаётся и доступна на запись, `server/src/services/health/storageCheck.js:L3-10#storageCheck`.
- Бэкап: `deploy/backup-uploads.sh` (архив `uploads-*.tar.gz`), восстановление описано в `docs/RUNBOOK.md:L159#Восстановление после потери данных`.
- Передача Claude: перед запуском скриншоты копируются в `.tracker-attachments/` рабочей копии ([materializeScreenshots](docs/functions/server/worker/materializeScreenshots.md#Алгоритм)), а в промпт добавляется их список. Папка не попадает в коммиты.
