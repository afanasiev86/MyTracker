# checkPassword

## Назначение
Проверяет пароль владельца из `ADMIN_PASSWORD` без утечки времени ответа. Используется при входе по паролю.

## Где объявлено
`server/src/services/auth/password.js:L4-11#checkPassword`

## Вход и выход
- Вход: `input` — строка пароля из запроса (приводится к строке).
- Выход: `true`, если пароль совпал; `false` во всех остальных случаях, включая пустой `ADMIN_PASSWORD`.

## Алгоритм
1. Читает ожидаемый пароль из окружения: `server/src/services/auth/password.js:L5@process.env.ADMIN_PASSWORD`.
2. Если пароль на сервере не задан, сразу возвращает `false` (вход закрыт, а не открыт): `server/src/services/auth/password.js:L6@if (!expected) return false;`.
3. Переводит оба значения в `Buffer`. Разная длина даёт `false` до сравнения, потому что `timingSafeEqual` требует одинаковой длины: `server/src/services/auth/password.js:L9@if (a.length !== b.length) return false;`.
4. Сравнивает байты через `timingSafeEqual`: `server/src/services/auth/password.js:L10@return timingSafeEqual(a, b);`.

## Ошибки и граничные случаи
- Пустая строка ввода не совпадает с непустым паролем, поэтому даёт `false`.
- Длина пароля проверяется открыто (разная длина быстро возвращает `false`). Это принятый компромисс: для личного трекера длина пароля не секрет.

## Связи
- Вызывается из `server/src/routes/auth/login.js:L5-15#login`.
- Подход к токенам: `docs/architecture/auth-tokens.md:L5#Вход по паролю`.
- Функция, которая выдаёт токен после успешной проверки: `docs/functions/server/auth/issueToken.md:L3#Назначение`.
