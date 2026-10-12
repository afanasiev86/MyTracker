# Функции: задачи, запуски, вопросы, проверка, стоимость

Для изменения этой области начинай с этого файла, затем открой ссылки.

## Задачи
Поля и статусы: `server/src/models/Task.js:L32-54#taskSchema`. Список статусов и переходы: `shared/statuses.js:L24-32#TRANSITIONS`. Создание и правка: `server/src/routes/tasks.js:L90-117#PATCH /:id` (подробно (`docs/functions/server/routes/patchTask.md:L13#Алгоритм`)).

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

## Вложения
Скриншоты к задаче (PNG, JPEG, GIF, WebP до 5 МБ). Файлы лежат в выбранном хранилище: MinIO на своём сервере или S3 в облаке reg.ru. В базе только метаданные: имя объекта, провайдер, тип и размер.
- Загрузка: `POST /api/tasks/:id/attachments`, тело — сам файл. Маршрут: `server/src/routes/tasks.js:L208@'/:id/attachments'`. Логика: `server/src/services/attachments.js:L38-47#saveAttachment`. Проверка типа и размера: `server/src/services/attachments.js:L22-28#checkAttachment`.
- Отдача: `GET /api/tasks/:id/attachments/:attachmentId` читает объект и отдаёт поток, бакет приватный. Логика: `server/src/services/attachments.js:L50-55#attachmentStream`.
- Провайдер вложения записывается при загрузке, поэтому смена хранилища не ломает старые файлы.
- Выбор хранилища: вкладка «Настройки» в интерфейсе, сервис `server/src/services/storage.js:L47-51#getActiveProvider`, маршрут `server/src/routes/storage.js`. Ключи доступа задаются только в переменных окружения (`server/.env.example`), в интерфейсе их не видно.
- Передача Claude: перед запуском скриншоты копируются в `.tracker-attachments/` рабочей копии ([materializeScreenshots](docs/functions/server/worker/materializeScreenshots.md#Алгоритм)), а в промпт добавляется их список. Папка не попадает в коммиты.
