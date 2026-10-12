# claudeTools

## Назначение
Формирует список инструментов, которые Claude может использовать без подтверждения. Список намеренно короткий: сеть и произвольные команды закрыты.

## Где объявлено
`server/src/worker/runTask.js:L21-29#claudeTools`

## Вход и выход
- Вход: нет.
- Выход: строка для аргумента `--allowedTools`.

## Алгоритм
1. Разрешает чтение и правку файлов: `server/src/worker/runTask.js:L23@'Read', 'Edit', 'Write',`.
2. Разрешает git: `server/src/worker/runTask.js:L24@'Bash(git *)',`.
3. Разрешает только нужные npm-команды (тесты, lint, сборка, установка): `server/src/worker/runTask.js:L25@'Bash(npm test*)'`.
4. Разрешает вызов скрипта трекера с любыми аргументами: `server/src/worker/runTask.js@` + "Bash(${TRACKER_CLI} *)"`. Путь берётся из `TRACKER_CLI`, который вычисляется в `server/src/worker/runTask.js:L17@const TRACKER_CLI`.

## Ошибки и граничные случаи
- В списке нет `curl` и `npx`. Раньше `curl` давал Claude доступ к произвольным адресам; теперь запросы к трекеру идут только через `deploy/tracker-api.sh`.
- Разрешение `Bash(... *)` с шаблоном означает, что аргументы не проверяются. Это ограничение инструмента: защита держится на том, что сам скрипт ходит только к `TRACKER_API`.

## Связи
- Подход и обоснование: `docs/architecture/tool-restriction.md:L5#Список инструментов`.
