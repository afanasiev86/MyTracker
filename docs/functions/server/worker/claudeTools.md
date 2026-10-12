# claudeTools

## Назначение
Формирует список инструментов, которые Claude может использовать без подтверждения. Список намеренно короткий: сеть и произвольные команды закрыты.

## Где объявлено
`server/src/worker/claudeTools.js:L8-16#claudeTools`

## Вход и выход
- Вход: нет.
- Выход: строка для аргумента `--allowedTools`.

## Алгоритм
1. Разрешает чтение и правку файлов: `server/src/worker/claudeTools.js:L10@'Read', 'Edit', 'Write',`.
2. Разрешает git: `server/src/worker/claudeTools.js:L11@'Bash(git *)',`.
3. Разрешает только нужные npm-команды (тесты, lint, сборка, установка): `server/src/worker/claudeTools.js:L12@'Bash(npm test*)'`.
4. Разрешает вызов скрипта трекера с любыми аргументами: `server/src/worker/runTask.js@` + "Bash(${TRACKER_CLI} *)"`. Путь берётся из `TRACKER_CLI`, который вычисляется в `server/src/worker/claudeTools.js:L4@const TRACKER_CLI`.

## Ошибки и граничные случаи
- В списке нет `curl` и `npx`. Раньше `curl` давал Claude доступ к произвольным адресам; теперь запросы к трекеру идут только через `deploy/tracker-api.sh`.
- Разрешение `Bash(... *)` с шаблоном означает, что аргументы не проверяются. Это ограничение инструмента: защита держится на том, что сам скрипт ходит только к `TRACKER_API`.

## Связи
- Подход и обоснование: `docs/architecture/tool-restriction.md:L5#Список инструментов`.
