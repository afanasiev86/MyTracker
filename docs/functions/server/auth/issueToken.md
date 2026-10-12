# issueToken

## Назначение
Выпускает подписанный JWT для владельца или воркера. В токен записывается текущая версия, чтобы его можно было отозвать.

## Где объявлено
`server/src/services/auth/tokens.js:L5-8#issueToken`

## Вход и выход
- Вход: `sub` — кто получает токен (`'owner'` или `'worker'`); `expiresIn` — срок, по умолчанию `'30d'`.
- Выход: `Promise<string>` — JWT.

## Алгоритм
1. Берёт текущую версию: `server/src/services/auth/tokens.js:L6@const tv = await currentTokenVersion();`.
2. Подписывает payload `{ sub, tv }` секретом `JWT_SECRET`: `server/src/services/auth/tokens.js:L7@return jwt.sign`.

## Ошибки и граничные случаи
- Если `JWT_SECRET` не задан, `jwt.sign` выбросит ошибку. Сервер при старте этого не проверяет, поэтому ошибка появится при первом входе. Это место для будущей проверки конфигурации.
- Срок воркера задаётся вызовом с `'2h'`: `server/src/worker/runTask.js:L39@TRACKER_TOKEN: await issueToken('worker', '2h')`.
- Функция стала асинхронной, потому что читает версию из базы. Все вызывающие должны ставить `await` — тесты это проверяют: `server/test/crm.db.test.js:L18@issueToken('owner')`.

## Связи
- Проверка токена: `docs/functions/server/auth/verifyToken.md:L3#Назначение`.
- Подход: `docs/architecture/auth-tokens.md:L11#Выпуск токенов`.
