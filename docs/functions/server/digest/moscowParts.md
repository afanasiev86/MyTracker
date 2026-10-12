# moscowParts

## Назначение
Возвращает день (`YYYY-MM-DD`) и час по московскому времени. Нужна, потому что сервер может работать в другом часовом поясе.

## Где объявлено
`server/src/services/digest.js:L15-21#moscowParts`

## Вход и выход
- Вход: `date`. Выход: `{ day, hour }`.

## Алгоритм
1. Форматирует дату в часовом поясе `Europe/Moscow` через общий форматтер: `server/src/services/digest.js:L5@const formatter = new Intl.DateTimeFormat`.
2. Собирает части в объект и формирует день: `server/src/services/digest.js:L15-21#moscowParts`.

## Связи
- Используется `buildDigest` и планировщиком. Проверка: `server/test/bot.test.js:L27@день по Москве`.
