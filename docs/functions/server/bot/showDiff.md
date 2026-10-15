# showDiff

## Назначение
Формирует текст diff для Telegram. Лимит сообщения Telegram учтён с запасом.

## Где объявлено
`server/src/bot/callbacks/showDiff.js:L7-14#showDiff`

## Вход и выход
- Вход: `task`.
- Выход: строка с diff или сообщением, что изменений нет.

## Алгоритм
1. Без ветки отвечает, что её ещё нет: `server/src/bot/callbacks/showDiff.js:L8@Ветка ещё не создана.`.
2. Получает diff через `server/src/services/diff.js:L8-15#taskDiff`.
3. Обрезает до `MAX_DIFF_TEXT` и добавляет пометку: `server/src/bot/callbacks/showDiff.js:L13@Показана часть diff`.

## Связи
- Вызывается из `docs/functions/server/bot/handleCallback.md:L13#Алгоритм`.
