# Авторизация и токены

Кратко: вход по паролю или через подпись Telegram Mini App, JWT с версией, отзыв через смену версии в базе.

## Вход по паролю
Сравнение за постоянное время: checkPassword (`docs/functions/server/auth/checkPassword.md:L13#Алгоритм`). Выдача токена: issueToken (`docs/functions/server/auth/issueToken.md:L3#Назначение`). Маршрут: `server/src/routes/auth/login.js:L6-16#login`. Лимит попыток: `server/src/app.js:L19-25#loginLimiter`.

## Вход через Telegram
Подпись `initData` проверяет `server/src/services/telegramAuth.js:L7-38#verifyInitData`. Маршрут `server/src/routes/auth/telegramLogin.js:L9-32#telegramLogin` дополнительно сверяет id с `TELEGRAM_OWNER_ID`.

## Выпуск токенов
Токен содержит `sub` и `tv` (версия). Срок: 30 дней для владельца, 2 часа для воркера (`server/src/worker/runTask.js:L45@TRACKER_TOKEN`).

## Проверка токена
verifyToken (`docs/functions/server/auth/verifyToken.md:L13#Алгоритм`) сверяет подпись, срок и версию. Middleware requireAuth (`docs/functions/server/auth/requireAuth.md:L13#Алгоритм`) отвечает 401.

## Отзыв токенов
Версия хранится в коллекции `Settings`, кэш в памяти процесса. revokeAllTokens (`docs/functions/server/auth/revokeAllTokens.md:L13#Алгоритм`) увеличивает версию, и все токены перестают работать. Кнопка в интерфейсе: `client/src/App.jsx:L68@logoutEverywhere`.
