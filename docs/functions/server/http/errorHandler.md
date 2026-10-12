# errorHandler

## Назначение
Единая обработка ошибок API: все ответы с ошибкой имеют вид `{ error: "сообщение" }` с HTTP-статусом (правило из `CLAUDE.md`).

## Где объявлено
`server/src/middleware/errorHandler.js:L4-22#errorHandler`

## Вход и выход
- Вход: `err` и стандартные аргументы Express.
- Выход: JSON-ответ с ошибкой.

## Алгоритм
1. Доменные ошибки (`DomainError`, см. `server/src/services/errors.js`) сопоставляют код со статусом: `server/src/middleware/errorHandler.js:L5@if (err instanceof DomainError)`. Код `not_found` → 404, `conflict` → 409, `invalid` → 400, `unsupported` → 415, `too_large` → 413, `unavailable` → 503. Сервисы бросают такие ошибки вместо того, чтобы возвращать статус.
2. Ошибки zod (`ZodError`) → 400 с текстом первого нарушения и списком `details`: `server/src/middleware/errorHandler.js:L8@if (err.name === 'ZodError')`.
3. Неверный ObjectId (`CastError`) → 400 `Некорректный ID`: `server/src/middleware/errorHandler.js:L12@if (err.name === 'CastError')`.
4. Нарушение уникальности (код 11000, например slug проекта) → 409: `server/src/middleware/errorHandler.js:L16@err.code === 11000`.
5. Остальное берёт статус из `err.status` (устаревший путь, новый код его не использует) (по умолчанию 500). Для 5xx пишет ошибку в лог и не показывает детали клиенту: `server/src/middleware/errorHandler.js:L21@Внутренняя ошибка`.

## Ошибки и граничные случаи
- Ошибки разбора JSON от `express.json` имеют `err.status` = 400 и попадают в последний пункт, поэтому получают понятный текст.
- Сообщения 4xx берутся из `err.message`. Поэтому в доменных ошибках нельзя писать внутренние детали.
- Маршруты не формируют статусы для ошибок сервисов. Исключение: запуски (`startTask`, `answerTask`, `cancelTask`) возвращают объект `{ error }`, потому что его читает бот.

## Связи
- Подключается последним в `server/src/app.js:L27-52#createApp`.
- Подход: `docs/features/crm-and-auth.md:L9#Ошибки API`.
