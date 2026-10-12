# Ограничение инструментов Claude

Кратко: Claude не имеет произвольного доступа в сеть. Запросы к трекеру идут через один скрипт, список инструментов задаётся при запуске.

## Список инструментов
claudeTools (`docs/functions/server/worker/claudeTools.md:L13#Алгоритм`) формирует `--allowedTools`. Нет `curl` и `npx`.

## Скрипт трекера
`deploy/tracker-api.sh` использует переменные `TRACKER_API` и `TRACKER_TOKEN`, которые воркер передаёт в окружение: `server/src/worker/runTask.js:L16@TRACKER_CLI`. Инструкция для Claude: `.claude/skills/implement-task/SKILL.md`.
