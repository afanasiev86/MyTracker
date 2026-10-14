# Функции: клиенты, проекты, вход и ошибки API

## Клиенты и проекты
Маршруты: `server/src/routes/clients/patchClient.js:L5-14#patchClient`, `server/src/routes/projects/deleteProject.js:L5-15#deleteProject`. Удаление проекта запрещено, если есть задачи (409). Формы в интерфейсе: `client/src/components/Projects.jsx`, `client/src/components/Clients.jsx`.
- Код проекта (slug) при создании строится сервером из названия: `server/src/services/projects/slug.js:L24-30#uniqueSlug` (кириллица в латиницу, занятый код получает суффикс `-2`, чужая папка в `REPOS_DIR` не подхватывается). В форме нового проекта поля кода нет, в карточке существующего код только показывается: `client/src/components/project/SlugField.jsx`.
- Клонирование: `server/src/services/projects/repo.js:L24-50#ensureRepo` клонирует `repoUrl` в `REPOS_DIR/<код>` при создании и при сохранении, если папки нет. Допустимы только `https://` и `git@host:путь`, локальные пути и `ext::` отклоняются (`isRepoUrl`), ожидание не больше 55 с. Итог приходит в ответе как `repo.status` (`none`, `exists`, `cloned`, `failed` и `error`); при `failed` проект всё равно сохранён.

## Вход и выход
requireAuth (`docs/functions/server/auth/requireAuth.md:L13#Алгоритм`), checkPassword (`docs/functions/server/auth/checkPassword.md:L13#Алгоритм`), отзыв revokeAllTokens (`docs/functions/server/auth/revokeAllTokens.md:L13#Алгоритм`). Подробно: auth-tokens (`docs/architecture/auth-tokens.md:L17#Отзыв токенов`).

## Ошибки API
Единый формат `{ error }`: errorHandler (`docs/functions/server/http/errorHandler.md:L13#Алгоритм`). Сборка приложения: createApp (`docs/functions/server/http/createApp.md:L13#Алгоритм`).

## Хранилище вложений
Файлы вложений лежат на диске сервера, выбора хранилища нет. Подробно о вложениях: [tasks-and-runs](docs/features/tasks-and-runs.md#Вложения).
