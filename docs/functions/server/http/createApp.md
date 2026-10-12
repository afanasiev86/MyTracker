# createApp

## Назначение
Собирает Express-приложение без `listen`, чтобы его можно было тестировать через Supertest.

## Где объявлено
`server/src/app.js:L20-37#createApp`

## Вход и выход
- Вход: нет.
- Выход: экземпляр Express-приложения.

## Алгоритм
1. Доверяет одному прокси (nginx), чтобы брать адрес клиента из `X-Forwarded-For` для лимита входа: `server/src/app.js:L23@app.set('trust proxy', 1);`.
2. Не подключает CORS: клиент и API работают на одном домене.
3. Ограничивает размер тела 1 МБ: `server/src/app.js:L25@express.json({ limit: '1mb' })`.
4. Открывает `/api/health` без авторизации: `server/src/app.js:L27@app.get('/api/health'`.
5. Вешает лимит входа и защиту на разделы: `server/src/app.js:L28@app.use('/api/auth', loginLimiter, authRoutes);` и `server/src/app.js:L29@app.use('/api/tasks', requireAuth, taskRoutes);`.
6. Отвечает 404 на неизвестные маршруты и подключает обработчик ошибок последним: `server/src/app.js:L35@app.use(errorHandler);`.

## Ошибки и граничные случаи
- Порядок middleware важен: обработчик ошибок должен идти после маршрутов.
- Лимит входа (`server/src/app.js:L12-18#loginLimiter`) действует на весь `/api/auth`, включая `/revoke`. Это безопасно, но выход на всех устройствах тоже попадает под лимит.

## Связи
- Точка входа сервера: `server/src/index.js:L28@createApp().listen(PORT`.
- Тесты: `server/test/app.test.js`.
