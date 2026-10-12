#!/usr/bin/env bash
# Проверка и восстановление MongoDB из архива, который создаёт backup-mongo.sh.
#
#   verify  — восстанавливает архив во временную базу mytracker_verify, печатает
#             число документов по коллекциям и удаляет временную базу.
#             Рабочую базу не трогает. Запускайте по расписанию, чтобы знать,
#             что копии действительно читаются.
#   restore — заменяет базу mytracker содержимым архива. Без --yes не работает.
#
# Примеры:
#   deploy/restore-mongo.sh verify /srv/backups/mytracker/mytracker-20261012-033000.archive.gz
#   deploy/restore-mongo.sh restore /srv/backups/mytracker/mytracker-20261012-033000.archive.gz --yes
#
# Пример cron (еженедельно, в воскресенье в 04:00, от root):
#   0 4 * * 0 /srv/mytracker/deploy/restore-mongo.sh verify "$(ls -t /srv/backups/mytracker/*.archive.gz | head -1)" >> /var/log/mytracker-backup.log 2>&1

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/mytracker}"
MODE="${1:-}"
ARCHIVE="${2:-}"
FLAG="${3:-}"
VERIFY_DB="mytracker_verify"

usage() {
  echo "Использование: $0 verify|restore <архив.archive.gz> [--yes]" >&2
  exit 2
}

[ -n "$MODE" ] && [ -n "$ARCHIVE" ] || usage
[ -f "$ARCHIVE" ] || { echo "Нет файла архива: $ARCHIVE" >&2; exit 1; }

# Считает документы в базе и, если DROP=1, удаляет её
COUNT_JS='
import mongoose from "mongoose";
await mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection.db;
const names = (await db.listCollections().toArray()).map((c) => c.name).sort();
if (names.length === 0) { console.error("В архиве нет коллекций"); process.exitCode = 1; }
for (const name of names) console.log(`${name}: ${await db.collection(name).countDocuments()}`);
if (process.env.DROP === "1") await db.dropDatabase();
await mongoose.disconnect();
'

# Архив подаётся в mongorestore через stdin. Имена баз переписываются через --nsFrom/--nsTo.
restore_into() {
  local target="$1"
  (cd "$APP_DIR" && docker compose exec -T mongo mongorestore \
    --archive --gzip --drop \
    --nsFrom='mytracker.*' --nsTo="$target.*") < "$ARCHIVE"
}

case "$MODE" in
  verify)
    echo "Проверяем архив: $ARCHIVE"
    # Если восстановление оборвалось, временную базу всё равно удаляем
    trap '(cd "$APP_DIR/server" && MONGO_URL="mongodb://127.0.0.1:27017/$VERIFY_DB" DROP=1 node --input-type=module -e "$COUNT_JS") >/dev/null 2>&1 || true' EXIT
    restore_into "$VERIFY_DB"
    (cd "$APP_DIR/server" && MONGO_URL="mongodb://127.0.0.1:27017/$VERIFY_DB" DROP=1 \
      node --input-type=module -e "$COUNT_JS")
    trap - EXIT
    echo "Архив читается, временная база удалена."
    ;;
  restore)
    if [ "$FLAG" != "--yes" ]; then
      echo "Восстановление заменит базу mytracker. Запустите с --yes, если это нужно." >&2
      exit 2
    fi
    echo "Восстанавливаем mytracker из: $ARCHIVE"
    (cd "$APP_DIR" && docker compose exec -T mongo mongorestore \
      --archive --gzip --drop --nsInclude='mytracker.*') < "$ARCHIVE"
    (cd "$APP_DIR/server" && MONGO_URL="mongodb://127.0.0.1:27017/mytracker" \
      node --input-type=module -e "$COUNT_JS")
    echo "Восстановление завершено."
    ;;
  *)
    usage
    ;;
esac
