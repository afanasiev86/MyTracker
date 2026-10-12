#!/usr/bin/env bash
# Бэкап MongoDB: дамп делается внутри контейнера mongo, сохраняется на хосте.
# Удаляет копии старше 14 дней.
# Пример cron (ежедневно в 03:30, от root):
#   30 3 * * * /srv/mytracker/deploy/backup-mongo.sh >> /var/log/mytracker-backup.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/mytracker}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups/mytracker}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/mytracker-$STAMP.archive.gz"

mkdir -p "$BACKUP_DIR"
(cd "$APP_DIR" && docker compose exec -T mongo mongodump --db mytracker --archive --gzip) > "$OUT"
find "$BACKUP_DIR" -name 'mytracker-*.archive.gz' -mtime +14 -delete
echo "Бэкап создан: $OUT"
