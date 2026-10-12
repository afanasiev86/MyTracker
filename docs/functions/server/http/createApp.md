# createApp

## Назначение
Собирает Express-приложение без `listen`, чтобы его можно было тестировать через Supertest.

## Где объявлено
`server/src/app.js:L25-48#createApp`

## Вход и выход
- Вход: нет.
- Выход: экземпляр Express-приложения.

## Алгоритм
1. Доверяет одному прокси (nginx), чтобы брать адрес клиента из `X-Forwarded-For` для лимита входа: `server/src/app.js:L28@app.set('trust proxy', 1);`.
2. Не подключает CORS: клиент и API работают на одном домене.
3. Ограничивает размер тела 1 МБ: `server/src/app.js:L30@express.json({ limit: '1mb' })`.
4. Подключает `/api/health` (публичная проверка и `/api/health/details` для владельца): `server/src/app.js:L33@app.use('/api/health', healthRoutes);`.
5. Вешает лимит входа и защиту на разделы: `server/src/app.js:L34@app.use('/api/auth'`. Владельческие разделы закрыты от заказчика: `server/src/app.js:L36@app.use('/api/tasks'`. Портал заказчика отдельно: `server/src/app.js:L43@app.use('/api/portal'`.
6. Отвечает 404 на неизвестные маршруты и подключает обработчик ошибок последним: `server/src/app.js:L46@app.use(errorHandler);`.

## Ошибки и граничные случаи
- Порядок middleware важен: обработчик ошибок должен идти после маршрутов.
- Лимит входа (`server/src/app.js:L17-23#loginLimiter`) действует на весь `/api/auth`, включая `/revoke`. Это безопасно, но выход на всех устройствах тоже попадает под лимит.

## Связи
- Точка входа сервера: `server/src/index.js:L32@createApp().listen(cfg.port`.
- Тесты: `server/test/app.test.js`.
