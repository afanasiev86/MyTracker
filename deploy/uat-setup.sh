#!/usr/bin/env bash
# Разовая настройка сервера под UAT-стенды: <slug>.<домен> с HTTPS и входом по паролю владельца трекера.
# Запуск под root:  sudo bash deploy/uat-setup.sh <домен> <почта для Let's Encrypt>
#   например: sudo bash deploy/uat-setup.sh afanasev.tech me@example.com
# Перед запуском в DNS должна быть запись A "*" на IP сервера.
# Скрипт можно запускать повторно. После обновления
# deploy/uat-expose.sh его нужно запустить снова, чтобы обновить копию в /usr/local/sbin.
# Что он даёт пользователю API (по умолчанию claude-worker): sudo без пароля ТОЛЬКО на /usr/local/sbin/uat-expose.
# Копия скрипта принадлежит root и недоступна воркеру для записи, иначе sudo на неё был бы общим sudo.

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="${APP_DIR:-/srv/mytracker}"
WORKER_USER="${WORKER_USER:-claude-worker}"
UAT_DIR="${UAT_DIR:-/srv/uat}"
# Порт API трекера: на него nginx стендов отправляет проверку входа
TRACKER_PORT="${TRACKER_PORT:-$(grep -E '^PORT=' "$APP_DIR/server/.env" 2>/dev/null | head -1 | cut -d= -f2)}"
TRACKER_PORT="${TRACKER_PORT:-3001}"
CONF_FILE=/etc/mytracker-uat.conf
EXPOSE_BIN=/usr/local/sbin/uat-expose
NGINX_DEFAULT=/etc/nginx/conf.d/00-uat-default.conf
SUDOERS_FILE=/etc/sudoers.d/mytracker-uat

[[ $EUID -eq 0 ]] || { echo "Запустите от root: sudo bash $0 <домен> <почта>"; exit 1; }
[[ $DOMAIN =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$ && -n $EMAIL ]] || { echo "Использование: sudo bash $0 <домен> <почта>"; exit 1; }
id "$WORKER_USER" >/dev/null 2>&1 || { echo "Нет пользователя $WORKER_USER. Сначала выполните deploy/bootstrap-vps.sh"; exit 1; }

echo "==> Пакеты: certbot с плагином nginx"
apt-get install -y certbot python3-certbot-nginx

echo "==> Настройки: $CONF_FILE"
printf 'DOMAIN=%s\nEMAIL=%s\nTRACKER_PORT=%s\n' "$DOMAIN" "$EMAIL" "$TRACKER_PORT" > "$CONF_FILE"
chmod 644 "$CONF_FILE"

echo "==> nginx: чужие и неизвестные адреса получают отказ, поддержка WebSocket для стендов"
cat > "$NGINX_DEFAULT" <<'EOF'
# Адрес, которого нет ни в одном правиле (в том числе любой поддомен из DNS-записи *), не должен попадать на трекер
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 444;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;
    ssl_reject_handshake on;
}
EOF
if ! nginx -t; then
  rm -f "$NGINX_DEFAULT"
  echo "nginx не принял правило отказа (возможно, default_server уже объявлен в другом файле). Изменение отменено." >&2
  exit 1
fi
systemctl reload nginx

echo "==> Скрипт открытия стендов: $EXPOSE_BIN"
install -m 750 -o root -g root "$APP_DIR/deploy/uat-expose.sh" "$EXPOSE_BIN"

echo "==> sudo на $EXPOSE_BIN: $SUDOERS_FILE"
TMP="$(mktemp)"
cat > "$TMP" <<EOF
# UAT-стенды трекера: только этот скрипт, аргументы он проверяет сам
$WORKER_USER ALL=(root) NOPASSWD: $EXPOSE_BIN *
EOF
visudo -cf "$TMP"
install -m 440 -o root -g root "$TMP" "$SUDOERS_FILE"
rm -f "$TMP"

echo "==> Папка стендов: $UAT_DIR"
mkdir -p "$UAT_DIR"
chown "$WORKER_USER:$WORKER_USER" "$UAT_DIR"

echo
echo "Готово. Осталось добавить в $APP_DIR/server/.env строку UAT_DOMAIN=$DOMAIN и перезапустить API:"
echo "  sudo systemctl restart mytracker-api"
echo "Вход на стенды: пароль владельца трекера (ADMIN_PASSWORD), отдельного логина больше нет."
echo "Проверка DNS: dig +short любой-поддомен.$DOMAIN (должен вернуть IP этого сервера)"
