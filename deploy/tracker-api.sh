#!/usr/bin/env bash
# Вызовы API трекера для Claude. Это единственный способ обращаться к API из запуска:
# в разрешённых инструментах Claude разрешён этот скрипт, а не curl.
# Использование: tracker-api.sh МЕТОД /путь [json-тело]
# Пример:       tracker-api.sh POST /tasks/ID/question '{"text":"Какой формат?"}'

set -euo pipefail

METHOD="${1:?Укажите метод: GET, POST, PATCH}"
ENDPOINT="${2:?Укажите путь, например /tasks/ID}"
BODY="${3:-}"

: "${TRACKER_API:?TRACKER_API не задан}"
: "${TRACKER_TOKEN:?TRACKER_TOKEN не задан}"

args=(-sS -X "$METHOD" -H "Authorization: Bearer $TRACKER_TOKEN" -H "Content-Type: application/json")
if [[ -n "$BODY" ]]; then
  args+=(-d "$BODY")
fi

curl "${args[@]}" "${TRACKER_API}${ENDPOINT}"
