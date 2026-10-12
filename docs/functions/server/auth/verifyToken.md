# verifyToken

## Назначение
Проверяет токен: подпись, срок действия и совпадение версии с текущей. Отзыв работает именно здесь.

## Где объявлено
`server/src/services/auth.js:L45-51#verifyToken`

## Вход и выход
- Вход: `token` — строка JWT.
- Выход: `Promise<payload>` с полями `sub`, `tv`, `iat`, `exp`. При неверном токене выбрасывает ошибку.

## Алгоритм
1. Проверяет подпись и срок `jwt.verify`: `server/src/services/auth.js:L46@const payload = jwt.verify`.
2. Сравнивает версию токена с текущей: `server/src/services/auth.js:L47@payload.tv !== await currentTokenVersion()`.
3. При несовпадении бросает `token revoked`: `server/src/services/auth.js:L48@throw new Error('token revoked')`.

## Ошибки и граничные случаи
- Ошибка подписи, истёкший срок и отзыв выглядят одинаково для вызывающего: все они превращаются в 401 в `server/src/middleware/auth.js:L3-15#requireAuth`. Это намеренно, чтобы не раскрывать причину.
- Токены, выпущенные до появления поля `tv`, не имеют его. Для них `payload.tv` равен `undefined`, и проверка их отвергнет. Это приемлемо: до версии 1 токенов не было в продакшене.

## Связи
- Вызывается из `server/src/middleware/auth.js:L3-15#requireAuth`.
- Подход: `docs/architecture/auth-tokens.md:L14#Проверка токена`.
