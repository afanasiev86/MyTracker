#!/usr/bin/env bash
# Бэкап вложений (скриншотов) с диска. Метаданные вложений лежат в MongoDB,
# сами файлы в папке ATTACHMENTS_DIR, поэтому для полной копии нужны оба бэкапа.
# Удаляет копии старше 14 дней.
# Пример cron (ежедневно в 03:45, от root):
#   45 3 * * * /srv/mytracker/deploy/backup-uploads.sh >> /var/log/mytracker-backup.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/mytracker}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups/mytracker}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/uploads-$STAMP.tar.gz"

UPLOADS_DIR="$(grep -E '^ATTACHMENTS_DIR=' "$APP_DIR/server/.env" 2>/dev/null | head -1 | cut -d= -f2 || true)"
UPLOADS_DIR="${UPLOADS_DIR:-$APP_DIR/uploads}"

[ -d "$UPLOADS_DIR" ] || { echo "Папки вложений нет: $UPLOADS_DIR (вложений ещё не было)"; exit 0; }

mkdir -p "$BACKUP_DIR"
tar -czf "$OUT" -C "$UPLOADS_DIR" .
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +14 -delete
echo "Вложения скопированы в: $OUT"
