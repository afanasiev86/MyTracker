# errorHandler

## Назначение
Единая обработка ошибок API: все ответы с ошибкой имеют вид `{ error: "сообщение" }` с HTTP-статусом (правило из `CLAUDE.md`).

## Где объявлено
`server/src/middleware/errorHandler.js:L1-16#errorHandler`

## Вход и выход
- Вход: `err` и стандартные аргументы Express.
- Выход: JSON-ответ с ошибкой.

## Алгоритм
1. Ошибки zod (`ZodError`) → 400 с текстом первого нарушения и списком `details`: `server/src/middleware/errorHandler.js:L2@if (err.name === 'ZodError')`.
2. Неверный ObjectId (`CastError`) → 400 `Некорректный ID`: `server/src/middleware/errorHandler.js:L6@if (err.name === 'CastError')`.
3. Нарушение уникальности (код 11000, например slug проекта) → 409: `server/src/middleware/errorHandler.js:L10@err.code === 11000`.
4. Остальное берёт статус из `err.status` (по умолчанию 500). Для 5xx пишет ошибку в лог и не показывает детали клиенту: `server/src/middleware/errorHandler.js:L15@Внутренняя ошибка`.

## Ошибки и граничные случаи
- Ошибки разбора JSON от `express.json` имеют `err.status` = 400 и попадают в последний пункт, поэтому получают понятный текст.
- Сообщения 4xx берутся из `err.message`. Поэтому в бизнес-ошибках нельзя писать внутренние детали.

## Связи
- Подключается последним в `server/src/app.js:L25-48#createApp`.
- Подход: `docs/features/crm-and-auth.md:L9#Ошибки API`.
