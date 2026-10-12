# requireAuth

## Назначение
Express-middleware: пропускает запрос только с действующим токеном в заголовке `Authorization: Bearer ...`.

## Где объявлено
`server/src/middleware/auth.js:L3-15#requireAuth`

## Вход и выход
- Вход: `req`, `res`, `next` (стандартные Express-аргументы).
- Выход: вызывает `next()` с `req.user` (payload токена) или отвечает 401.

## Алгоритм
1. Читает заголовок и извлекает токен: `server/src/middleware/auth.js:L5@const token = header.startsWith('Bearer ')`.
2. Без токена отвечает 401 `Нужна авторизация`: `server/src/middleware/auth.js:L7@Нужна авторизация`.
3. Проверяет токен через `verifyToken` и кладёт payload в `req.user`: `server/src/middleware/auth.js:L10@req.user = await verifyToken(token);`.
4. Любая ошибка проверки даёт 401 `Токен недействителен. Войдите снова.`: `server/src/middleware/auth.js:L13@Токен недействителен`.

## Ошибки и граничные случаи
- Клиент по этому тексту понимает, что сессия истекла. Обработка на клиенте: `client/src/api/http.js:L22-44#request` и `client/src/App.jsx:L28-132#App`.
- Middleware асинхронный, поэтому Express 4 не перехватит его исключения сам. Все ошибки внутри уже обёрнуты в `try/catch`.

## Связи
- Подключается в `server/src/app.js:L25-48#createApp` для всех маршрутов кроме `/api/health` и входа.
- Подход: `docs/architecture/auth-tokens.md:L14#Проверка токена`.
