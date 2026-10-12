#!/usr/bin/env bash
# Обновление трекера на сервере: новый код, зависимости, сборка клиента и перезапуск API.
# Если сборка или запуск не удались, возвращает прежнюю версию.
# Запускается из API через systemd-run (см. deploy/ops-setup.sh), а не вручную.
# Итог пишет в .ops/deploy-result.json: API отправит его владельцу в Telegram.

set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$APP_DIR/.ops"
LOCK="$STATE_DIR/deploy.lock"
RESULT="$STATE_DIR/deploy-result.json"
SYSTEMCTL=/usr/bin/systemctl

mkdir -p "$STATE_DIR"
if [[ -e "$LOCK" ]] && kill -0 "$(cat "$LOCK")" 2>/dev/null; then
  echo "Обновление уже идёт"
  exit 1
fi
echo $$ > "$LOCK"
trap 'rm -f "$LOCK"' EXIT

cd "$APP_DIR"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
FROM_FULL="$(git rev-parse HEAD)"
FROM="$(git rev-parse --short HEAD)"
PORT="$(grep -E '^PORT=' server/.env 2>/dev/null | head -1 | cut -d= -f2)"
PORT="${PORT:-3001}"

# finish <true|false> <сообщение владельцу> [версия после обновления]
finish() {
  OK="$1" MESSAGE="$2" TO="${3:-$FROM}" FROM="$FROM" RESULT="$RESULT" node -e '
    const e = process.env;
    require("fs").writeFileSync(e.RESULT, JSON.stringify({
      ok: e.OK === "true", from: e.FROM, to: e.TO, message: e.MESSAGE,
      finishedAt: new Date().toISOString(), reported: false,
    }));'
}

build() { npm ci && npm run build; }

rollback() { git reset --hard "$FROM_FULL" && build; }

# API после перезапуска отвечает: 200, либо 503 (часть проверок здоровья не прошла, но сервер жив)
api_answers() {
  local code
  for _ in $(seq 1 15); do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/health" || true)"
    [[ "$code" == "200" || "$code" == "503" ]] && return 0
    sleep 2
  done
  return 1
}

if ! git fetch origin "$BRANCH" || ! git merge --ff-only "origin/$BRANCH"; then
  finish false "Обновление не выполнено: не удалось получить новый код с GitHub. Версия $FROM не изменилась."
  exit 1
fi

TO="$(git rev-parse --short HEAD)"
if [[ "$TO" == "$FROM" ]]; then
  finish true "Уже последняя версия ($FROM), обновлять нечего."
  exit 0
fi

if ! build; then
  rollback
  finish false "Обновление отменено: версия $TO не собралась. Возвращена версия $FROM." "$TO"
  exit 1
fi

if sudo -n "$SYSTEMCTL" restart mytracker-api && api_answers; then
  finish true "MyTracker обновлён: $FROM → $TO." "$TO"
  exit 0
fi

rollback
sudo -n "$SYSTEMCTL" restart mytracker-api
finish false "Версия $TO не запустилась. Возвращена версия $FROM." "$TO"
exit 1
