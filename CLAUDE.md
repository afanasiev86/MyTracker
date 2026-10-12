# MyTracker: правила для Claude Code

## Стек
- Node 20+, ESM (`"type": "module"`) в server и client
- Сервер: Express 4, Mongoose, jsonwebtoken, zod для валидации входа
- Клиент: React 18, Vite, Ant Design 5 (`antd`), react-router-dom. Свой CSS только для доски и мелочей (`client/src/styles.css`)
- Тесты сервера: Jest + Supertest (`server/test/`)
- Пакеты: npm workspaces. Не добавляйте yarn/pnpm lock-файлы.

## Структура
- `server/src/routes/` только маршруты, без бизнес-логики
- `server/src/models/` Mongoose-схемы
- `server/src/middleware/` auth и обработка ошибок
- `server/src/app.js` создание Express-приложения (без `listen`, чтобы тестировать)
- `server/src/index.js` подключение к БД и запуск
- `client/src/api.js` все запросы к API, в компонентах `fetch` не вызывать напрямую
- `client/src/components/` UI-компоненты

## API
- Все маршруты `/api/*`, кроме `/api/health` и `/api/auth/login`, требуют заголовок `Authorization: Bearer <token>`
- Ошибки возвращаются как `{ error: "сообщение" }` с HTTP-статусом
- Валидация входящих данных через zod на границе роута

## Команды
- `npm run dev` запуск клиента и сервера
- `npm test` тесты сервера
- `npm run lint` линтер
- `npm run build` сборка клиента

## Правила работы
- Перед изменением функционала читайте `docs/README.md` (карта: что где менять). Новые документы не создавайте: обновляйте существующие и запускайте `npm run docs:build` и `npm run docs:check`.
- Перед коммитом обязательно запускайте `npm run lint` и `npm test`
- Не меняйте файлы вне `outOfScope` задачи
- Не добавляйте зависимости без причины, в коммите сообщите, зачем они нужны
- Секреты не коммитьте: `.env` в `.gitignore`
