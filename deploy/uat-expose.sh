#!/usr/bin/env bash
# Открывает UAT-стенд проекта: правило nginx для <slug>.<домен> с HTTPS и входом по паролю владельца трекера,
# проксирует на локальный порт стенда. Вход делает API трекера (/api/uat-gate): nginx спрашивает его на каждый запрос
# (auth_request), без cookie-пропуска отправляет на форму входа. Basic auth не используется: приложения стендов
# сами отправляют заголовок Authorization (Bearer-токены), и nginx принимал бы его за чужой пароль.
# Запускается трекером через sudo (см. deploy/uat-setup.sh, где скрипт копируется в /usr/local/sbin/uat-expose).
# Аргументы приходят от процесса без привилегий, поэтому проверяются здесь, а домен и почту скрипт берёт из файла root.
# Можно запускать повторно: сертификат выпускается один раз, правило пересоздаётся.
#   uat-expose <slug> <порт>

set -euo pipefail

CONF_FILE=/etc/mytracker-uat.conf
RESERVED=" www api mail smtp imap ftp ns1 ns2 admin tracker uat "
PORT_MIN=4100
PORT_MAX=4999

SLUG="${1:-}"
PORT="${2:-}"

[[ $EUID -eq 0 ]] || { echo "Запустите от root" >&2; exit 1; }
[[ -r $CONF_FILE ]] || { echo "Нет $CONF_FILE: выполните deploy/uat-setup.sh" >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONF_FILE"
[[ -n "${DOMAIN:-}" && -n "${EMAIL:-}" ]] || { echo "В $CONF_FILE нужны DOMAIN и EMAIL" >&2; exit 1; }
# Порт API трекера, где работает вход (/api/uat-gate)
TRACKER_PORT="${TRACKER_PORT:-3001}"
[[ $TRACKER_PORT =~ ^[0-9]+$ ]] || { echo "TRACKER_PORT в $CONF_FILE должен быть числом" >&2; exit 1; }

[[ $SLUG =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]] || { echo "Недопустимый код проекта: $SLUG" >&2; exit 1; }
[[ $RESERVED != *" $SLUG "* ]] || { echo "Имя $SLUG зарезервировано" >&2; exit 1; }
[[ $PORT =~ ^[0-9]+$ ]] && (( PORT >= PORT_MIN && PORT <= PORT_MAX )) || { echo "Порт должен быть от $PORT_MIN до $PORT_MAX" >&2; exit 1; }

HOST="$SLUG.$DOMAIN"
CONF="/etc/nginx/conf.d/uat-$SLUG.conf"
CERT="/etc/letsencrypt/live/$HOST/fullchain.pem"

reload_nginx() {
  nginx -t >/dev/null 2>&1 || { nginx -t >&2; return 1; }
  systemctl reload nginx
}

# Откат: убираем наше правило, чтобы битый файл не остановил nginx для всех остальных сайтов
fail() { rm -f "$CONF"; echo "$1" >&2; exit 1; }

if [[ ! -f $CERT ]]; then
  cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $HOST;
    return 404;
}
EOF
  reload_nginx || fail "nginx не принял временное правило для $HOST"
  certbot certonly --nginx -d "$HOST" --non-interactive --agree-tos -m "$EMAIL" >&2 \
    || fail "Не удалось получить сертификат для $HOST: проверьте, что DNS-запись * указывает на этот сервер"
fi

cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $HOST;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $HOST;

    ssl_certificate $CERT;
    ssl_certificate_key /etc/letsencrypt/live/$HOST/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    add_header Strict-Transport-Security "max-age=15552000" always;
    add_header X-Robots-Tag "noindex" always;

    # Форма входа и её отправка: обслуживает API трекера
    location = /__uat/login {
        proxy_pass http://127.0.0.1:$TRACKER_PORT/api/uat-gate/login;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For \$remote_addr;
    }

    # Проверка cookie-пропуска перед каждым запросом к стенду (только для nginx)
    location = /__uat/check {
        internal;
        proxy_pass http://127.0.0.1:$TRACKER_PORT/api/uat-gate/check;
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";
        proxy_set_header Host \$host;
    }

    location @uat_login {
        return 302 /__uat/login?next=\$uri;
    }

    location / {
        auth_request /__uat/check;
        error_page 401 = @uat_login;

        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        client_max_body_size 20m;
        proxy_read_timeout 120s;
    }
}
EOF
reload_nginx || fail "nginx не принял правило для $HOST"
echo "https://$HOST -> 127.0.0.1:$PORT"
