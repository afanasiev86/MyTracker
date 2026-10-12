# revokeAllTokens

## Назначение
Отзывает все выданные токены: увеличивает версию в базе. Токены с прежней версией перестают проходить проверку.

## Где объявлено
`server/src/services/auth/tokenVersion.js:L19-26#revokeAllTokens`

## Вход и выход
- Вход: нет.
- Выход: `Promise<void>`. Побочный эффект: новая версия в базе и в кэше.

## Алгоритм
1. Атомарно увеличивает `tokenVersion` на 1: `server/src/services/auth/tokenVersion.js:L22@$inc: { tokenVersion: 1 }`.
2. Создаёт документ, если его не было (`upsert: true`).
3. Обновляет кэш значением из ответа базы, чтобы текущий процесс сразу отверг старые токены: `server/src/services/auth/tokenVersion.js:L13@cachedVersion = doc.tokenVersion;`.

## Ошибки и граничные случаи
- Отзыв глобальный: сбрасываются все токены, включая токен воркера и токен Mini App. Это выбор по умолчанию: частичный отзыв потребовал бы хранить список токенов.
- После отзыва нужно войти заново везде. Именно это описано в подтверждении в интерфейсе: `client/src/App.jsx:L10-75#App`.

## Связи
- Вызывается из `server/src/routes/auth/revokeSessions.js:L4-11#revokeSessions`.
- Клиентская сторона: ``client/src/api/auth.js:L10-10#revokeAllSessions``.
- Подход: `docs/architecture/auth-tokens.md:L17#Отзыв токенов`.
