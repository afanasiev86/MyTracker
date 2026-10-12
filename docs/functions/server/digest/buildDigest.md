# buildDigest

## Назначение
Собирает текст утреннего дайджеста: просроченные, на сегодня и ожидающие ответа. Чистая функция: время передаётся аргументом.

## Где объявлено
`server/src/services/digest.js:L24-40#buildDigest`

## Вход и выход
- Вход: `tasks` (список задач), `now` (момент времени). Выход: текст или `null`, если сообщать не о чем.

## Алгоритм
1. Определяет сегодняшний день по Москве: `server/src/services/digest.js:L25@const today = moscowParts(now).day;`.
2. Отбирает открытые задачи (не `done`): `server/src/services/digest.js:L26@const open = tasks.filter`.
3. Три выборки: ожидающие ответа, на сегодня, просроченные: `server/src/services/digest.js:L28@const waiting`, `server/src/services/digest.js:L29@const dueToday`, `server/src/services/digest.js:L30@const overdue`.
4. Пустой результат даёт `null`: `server/src/services/digest.js:L38@if (sections.length === 0) return null;`.

## Связи
- День: `docs/functions/server/digest/moscowParts.md:L3#Назначение`. Расписание: `docs/functions/server/digest/startDigestScheduler.md:L12#Алгоритм`.
