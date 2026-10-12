# verifyInitData

## Назначение
Проверяет подпись `initData` от Telegram Mini App. Без неё любой мог бы назваться владельцем.

## Где объявлено
`server/src/services/telegramAuth.js:L7-34#verifyInitData`

## Вход и выход
- Вход: `initData`, `botToken`, `nowSec` (для тестов). Выход: `{ ok, user }` или `{ ok: false, reason }`.

## Алгоритм
1. Достаёт `hash` и убирает его из параметров: `server/src/services/telegramAuth.js:L13@params.delete('hash');`.
2. Собирает строку проверки: параметры по алфавиту через перевод строки: `server/src/services/telegramAuth.js:L15@const dataCheckString`.
3. Ключ = HMAC-SHA256 токена с ключом `WebAppData`, подпись = HMAC от строки проверки: `server/src/services/telegramAuth.js:L20@const secretKey`.
4. Сравнение за постоянное время: `server/src/services/telegramAuth.js:L23@timingSafeEqual(received, expected)`.
5. Данные старше 24 часов отвергаются: `server/src/services/telegramAuth.js:L5@MAX_AGE_SEC`.

## Ошибки и граничные случаи
- Некорректный JSON в поле `user` выбросит ошибку: `server/src/services/telegramAuth.js:L32@JSON.parse(params.get('user'))`. Маршрут передаст её в обработчик ошибок и вернёт 500. Это можно сделать аккуратнее (400), но подпись уже проверена, поэтому риск низкий.

## Связи
- Маршрут: `server/src/routes/auth.js:L25-39#POST /telegram`. Подход: `docs/architecture/auth-tokens.md:L8#Вход через Telegram`.
