#!/usr/bin/env bash
# Разовая настройка прав для раздела «Сервер» (управление сервисами, журналы, обновление из Telegram и интерфейса).
# Запуск под root:  sudo bash deploy/ops-setup.sh
# Скрипт можно запускать повторно. Что он даёт пользователю API (по умолчанию claude-worker):
#   - чтение журналов systemd (группа systemd-journal);
#   - sudo без пароля ТОЛЬКО на перечисленные ниже команды, никакого общего sudo.

set -euo pipefail

APP_DIR="${APP_DIR:-/srv/mytracker}"
WORKER_USER="${WORKER_USER:-claude-worker}"
SUDOERS_FILE="/etc/sudoers.d/mytracker-ops"
SYSTEMCTL=/usr/bin/systemctl
SYSTEMD_RUN=/usr/bin/systemd-run
BASH_BIN=/usr/bin/bash

[[ $EUID -eq 0 ]] || { echo "Запустите от root: sudo bash $0"; exit 1; }
id "$WORKER_USER" >/dev/null 2>&1 || { echo "Нет пользователя $WORKER_USER. Сначала выполните deploy/bootstrap-vps.sh"; exit 1; }

echo "==> Журналы: $WORKER_USER в группе systemd-journal"
usermod -aG systemd-journal "$WORKER_USER"

echo "==> sudo на конкретные команды: $SUDOERS_FILE"
TMP="$(mktemp)"
cat > "$TMP" <<EOF
# Раздел «Сервер» трекера: только эти команды, с точными аргументами
$WORKER_USER ALL=(root) NOPASSWD: $SYSTEMCTL restart mytracker-api
$WORKER_USER ALL=(root) NOPASSWD: $SYSTEMCTL restart nginx
$WORKER_USER ALL=(root) NOPASSWD: $SYSTEMCTL start nginx
$WORKER_USER ALL=(root) NOPASSWD: $SYSTEMCTL stop nginx
$WORKER_USER ALL=(root) NOPASSWD: $SYSTEMD_RUN --unit=mytracker-deploy --uid=$WORKER_USER --collect $BASH_BIN $APP_DIR/deploy/update.sh
EOF
visudo -cf "$TMP"
install -m 440 -o root -g root "$TMP" "$SUDOERS_FILE"
rm -f "$TMP"

echo "==> Применяем группу: перезапуск API"
"$SYSTEMCTL" restart mytracker-api

echo "Готово. Проверка: sudo -u $WORKER_USER sudo -n $SYSTEMCTL restart nginx"
