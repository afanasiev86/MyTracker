#!/usr/bin/env bash
# Сквозная проверка трекера через API. Ничего не меняет в проектах, создаёт одну тестовую задачу и удаляет её статус.
# Использование:
#   API=http://127.0.0.1:3001/api PASSWORD='пароль' ./scripts/smoke.sh
#   (или локально: API=http://localhost:3001/api PASSWORD=... ./scripts/smoke.sh)

set -uo pipefail

API="${API:-http://127.0.0.1:3001/api}"
PASSWORD="${PASSWORD:?Задайте PASSWORD}"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "OK    $name ($actual)"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $name: ожидали $expected, получили $actual"
    FAIL=$((FAIL + 1))
  fi
}

json_field() { sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p" | head -n1; }

code() { curl -s -o /tmp/smoke_body.$$ -w '%{http_code}' "$@"; }

echo "Проверяем $API"

check "health" "200" "$(code "$API/health")"

LOGIN_BODY=$(curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_BODY" | json_field token)
if [[ -z "$TOKEN" ]]; then
  echo "FAIL  вход: токен не получен ($LOGIN_BODY)"
  exit 1
fi
echo "OK    вход по паролю"
PASS=$((PASS + 1))
AUTH="Authorization: Bearer $TOKEN"

check "без токена список закрыт" "401" "$(code "$API/tasks")"

check "неверный пароль отклоняется" "401" "$(code -X POST "$API/auth/login" -H 'Content-Type: application/json' -d '{"password":"wrong-wrong"}')"

CREATE_BODY=$(curl -s -X POST "$API/tasks" -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"project":"smoke","title":"Smoke test, можно удалить","acceptance":["проверка"]}')
TASK_ID=$(echo "$CREATE_BODY" | json_field _id)
if [[ -z "$TASK_ID" ]]; then
  echo "FAIL  создание задачи: $CREATE_BODY"
  FAIL=$((FAIL + 1))
else
  echo "OK    создание задачи ($TASK_ID)"
  PASS=$((PASS + 1))
fi

check "запуск из бэклога запрещён" "409" \
  "$(code -X POST "$API/tasks/$TASK_ID/run" -H "$AUTH")"

check "прыжок backlog → done запрещён" "409" \
  "$(code -X PATCH "$API/tasks/$TASK_ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"done"}')"

check "backlog → ready разрешён" "200" \
  "$(code -X PATCH "$API/tasks/$TASK_ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"ready"}')"

check "комментарий добавляется" "201" \
  "$(code -X POST "$API/tasks/$TASK_ID/comments" -H "$AUTH" -H 'Content-Type: application/json' -d '{"text":"smoke"}')"

check "diff без ветки отдаёт 404" "404" \
  "$(code "$API/tasks/$TASK_ID/diff" -H "$AUTH")"

check "статистика стоимости" "200" \
  "$(code "$API/stats/costs" -H "$AUTH")"

# Уборка: возвращаем задачу в бэклог, удалить через API пока нельзя
curl -s -o /dev/null -X PATCH "$API/tasks/$TASK_ID" -H "$AUTH" -H 'Content-Type: application/json' -d '{"status":"backlog"}'

rm -f /tmp/smoke_body.$$

echo
echo "Итог: успешно $PASS, с ошибками $FAIL"
[[ $FAIL -eq 0 ]]
