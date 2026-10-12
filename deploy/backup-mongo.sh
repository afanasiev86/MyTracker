#!/usr/bin/env bash
# Бэкап MongoDB: делает дамп и удаляет копии старше 14 дней.
# Пример cron (ежедневно в 03:30):
#   30 3 * * * /srv/mytracker/deploy/backup-mongo.sh >> /var/log/mytracker-backup.log 2>&1

set -euo pipefail

MONGO_URL="${MONGO_URL:-mongodb://127.0.0.1:27017/mytracker}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups/mytracker}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"
mongodump --uri="$MONGO_URL" --archive="$BACKUP_DIR/mytracker-$STAMP.archive" --gzip
find "$BACKUP_DIR" -name 'mytracker-*.archive' -mtime +14 -delete
echo "Бэкап создан: $BACKUP_DIR/mytracker-$STAMP.archive"
