# moscowParts

## Назначение
Возвращает день (`YYYY-MM-DD`) и час по московскому времени. Нужна, потому что сервер может работать в другом часовом поясе.

## Где объявлено
`server/src/services/digest/moscowParts.js:L14-20#moscowParts`

## Вход и выход
- Вход: `date`. Выход: `{ day, hour }`.

## Алгоритм
1. Форматирует дату в часовом поясе `Europe/Moscow` через общий форматтер: `server/src/services/digest/moscowParts.js:L4@const formatter = new Intl.DateTimeFormat`.
2. Собирает части в объект и формирует день: `server/src/services/digest/moscowParts.js:L14-20#moscowParts`.

## Связи
- Используется `buildDigest` и планировщиком. Проверка: `server/test/bot.test.js:L28@день по Москве`.
