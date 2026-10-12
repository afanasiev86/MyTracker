# startDigestScheduler

## Назначение
Отправляет дайджест один раз в день в 09:00 по Москве. Проверяет время раз в минуту.

## Где объявлено
`server/src/services/digestScheduler/startDigestScheduler.js:L12-33#startDigestScheduler`

## Вход и выход
- Вход: `now`, `intervalMs` (для тестов). Выход: таймер или `null`, если Telegram не настроен.

## Алгоритм
1. Без Telegram планировщик не запускается: `server/src/services/digestScheduler/startDigestScheduler.js:L13@if (!telegramEnabled()) return null;`.
2. Каждую минуту проверяет час по Москве: `server/src/services/digestScheduler/startDigestScheduler.js:L18@if (hour !== DIGEST_HOUR) return;`.
3. Сверяет день с сохранённым в базе: `server/src/services/digestScheduler/startDigestScheduler.js:L21@if (await lastDigestDay() === day) return;`. Состояние хранится в `Settings` (поле `digestDay`), поэтому перезапуск не даёт повтора.
4. Запоминает день до отправки: `server/src/services/digestScheduler/startDigestScheduler.js:L22@await saveDigestDay(day);`.
5. Собирает задачи и отправляет, если есть что сообщить: `server/src/services/digestScheduler/startDigestScheduler.js:L25@const text = buildDigest(tasks, current);`.
6. Таймер не держит процесс: `server/src/services/digestScheduler/startDigestScheduler.js:L31@timer.unref();`.

## Ограничения
- Если сервер запущен после 09:00, дайджест за этот день не отправится. Это осознанный выбор: не присылать сводку с опозданием.
- Состояние в базе: `docs/architecture/telegram-transport.md:L11#Дайджест`.

## Связи
- Текст: `docs/functions/server/digest/buildDigest.md:L3#Назначение`. Подход: `docs/architecture/telegram-transport.md:L11#Дайджест`.
