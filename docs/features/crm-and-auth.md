# Функции: клиенты, проекты, вход и ошибки API

## Клиенты и проекты
Маршруты: `server/src/routes/clients/patchClient.js:L5-14#patchClient`, `server/src/routes/projects/deleteProject.js:L5-15#deleteProject`. Удаление проекта запрещено, если есть задачи (409). Формы в интерфейсе: `client/src/components/Projects.jsx`, `client/src/components/Clients.jsx`.

## Вход и выход
requireAuth (`docs/functions/server/auth/requireAuth.md:L13#Алгоритм`), checkPassword (`docs/functions/server/auth/checkPassword.md:L13#Алгоритм`), отзыв revokeAllTokens (`docs/functions/server/auth/revokeAllTokens.md:L13#Алгоритм`). Подробно: auth-tokens (`docs/architecture/auth-tokens.md:L17#Отзыв токенов`).

## Ошибки API
Единый формат `{ error }`: errorHandler (`docs/functions/server/http/errorHandler.md:L13#Алгоритм`). Сборка приложения: createApp (`docs/functions/server/http/createApp.md:L13#Алгоритм`).

## Хранилище вложений
Выбор MinIO или S3 — вкладка «Настройки». Состояние: `server/src/services/storage/providers.js:L41-43#listProviders`, смена: `server/src/services/storage/selection.js:L14-21#setActiveProvider`. Подробно о вложениях: [tasks-and-runs](docs/features/tasks-and-runs.md#Вложения).
