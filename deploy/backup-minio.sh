#!/usr/bin/env bash
# Бэкап вложений (скриншотов) из MinIO. Метаданные вложений лежат в MongoDB,
# сами файлы — в MinIO, поэтому для полной копии нужны оба бэкапа.
# Копия зеркальная: в каталоге BACKUP_DIR/minio лежит последнее состояние бакета.
# Пример cron (ежедневно в 03:45, от root):
#   45 3 * * * /srv/mytracker/deploy/backup-minio.sh >> /var/log/mytracker-backup.log 2>&1
#
# Образ клиента mc по умолчанию минимальный. Чтобы зафиксировать версию,
# задайте MC_IMAGE, например minio/mc:<тег>.

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/mytracker}"
BACKUP_DIR="${BACKUP_DIR:-/srv/backups/mytracker}"
MC_IMAGE="${MC_IMAGE:-minio/mc}"
OUT_DIR="$BACKUP_DIR/minio"

# Ключи берём из .env проекта (их же читает docker compose)
if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$APP_DIR/.env"
  set +a
fi
MINIO_ROOT_USER="${MINIO_ACCESS_KEY:-mytracker}"
MINIO_ROOT_PASSWORD="${MINIO_SECRET_KEY:-change-me-minio-secret}"
BUCKET="${MINIO_BUCKET:-mytracker-attachments}"
export MINIO_ROOT_USER MINIO_ROOT_PASSWORD BUCKET

MINIO_ID="$(cd "$APP_DIR" && docker compose ps -q minio)"
[ -n "$MINIO_ID" ] || { echo "Контейнер minio не запущен" >&2; exit 1; }

mkdir -p "$OUT_DIR"
# Контейнер клиента делит сеть с MinIO, поэтому адрес 127.0.0.1:9000 доступен без публикации порта
docker run --rm \
  --network "container:$MINIO_ID" \
  -v "$OUT_DIR:/backup" \
  -e MINIO_ROOT_USER -e MINIO_ROOT_PASSWORD -e BUCKET \
  --entrypoint sh "$MC_IMAGE" -c '
    mc alias set src http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
    mc mirror --overwrite "src/$BUCKET" /backup
  '
echo "Вложения скопированы в: $OUT_DIR"
