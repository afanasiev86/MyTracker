# startDigestScheduler

## Назначение
Отправляет дайджест один раз в день в 09:00 по Москве. Проверяет время раз в минуту.

## Где объявлено
`server/src/services/digestScheduler.js:L10-30#startDigestScheduler`

## Вход и выход
- Вход: `now`, `intervalMs` (для тестов). Выход: таймер или `null`, если Telegram не настроен.

## Алгоритм
1. Без Telegram планировщик не запускается: `server/src/services/digestScheduler.js:L11@if (!telegramEnabled()) return null;`.
2. Каждую минуту проверяет час и день: `server/src/services/digestScheduler.js:L17@if (hour !== DIGEST_HOUR || day === lastSentDay) return;`.
3. Запоминает день до отправки, чтобы не отправить дважды: `server/src/services/digestScheduler.js:L18@lastSentDay = day;`.
4. Собирает задачи и отправляет, если есть что сообщить: `server/src/services/digestScheduler.js:L22@const text = buildDigest(tasks, current);`.
5. Таймер не держит процесс: `server/src/services/digestScheduler.js:L28@timer.unref();`.

## Ограничения
- Если сервер запущен после 09:00, дайджест за этот день не отправится. Это осознанный выбор: не присылать сводку с опозданием.
- Запуск `lastSentDay` в памяти: после перезапуска в тот же день дайджест придёт повторно. Для личного трекера это приемлемо.

## Связи
- Текст: `docs/functions/server/digest/buildDigest.md:L3#Назначение`. Подход: `docs/architecture/telegram-transport.md:L11#Дайджест`.
