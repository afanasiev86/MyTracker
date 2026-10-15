#!/usr/bin/env bash
# Первичная установка трекера на чистый Ubuntu 22.04/24.04 VPS.
# Запуск под root:  sudo bash deploy/bootstrap-vps.sh
# Скрипт можно запускать повторно: уже установленные части пропускаются.
# После него нужно вручную: `sudo -u claude-worker claude` и /login, и заполнить Telegram в .env.

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/afanasiev86/MyTracker.git}"
BRANCH="${BRANCH:-init}"
APP_DIR="/srv/mytracker"
WORKER_USER="claude-worker"
REPOS_DIR="/srv/repos"
BACKUP_DIR="/srv/backups/mytracker"

log() { echo -e "\n==> $*"; }

[[ $EUID -eq 0 ]] || { echo "Запустите от root: sudo bash $0"; exit 1; }

log "Системные пакеты"
apt-get update -y
apt-get install -y git curl ca-certificates gnupg openssl nginx

log "Node.js 20"
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1)" != "v20" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

log "Claude Code CLI"
command -v claude >/dev/null || npm install -g @anthropic-ai/claude-code

log "MongoDB 7 (через Docker)"
if ! command -v docker >/dev/null; then
  apt-get install -y docker.io
  apt-get install -y docker-compose-v2 || apt-get install -y docker-compose-plugin || {
    echo "Не найден плагин docker compose. Установите его вручную и запустите скрипт снова."; exit 1; }
  systemctl enable --now docker
fi

log "Пользователь воркера"
id "$WORKER_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$WORKER_USER"
usermod -aG docker "$WORKER_USER"
mkdir -p "$REPOS_DIR" "$BACKUP_DIR"
chown -R "$WORKER_USER:$WORKER_USER" "$REPOS_DIR" "$BACKUP_DIR"

log "Код трекера"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout "$BRANCH" && git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi
chown -R "$WORKER_USER:$WORKER_USER" "$APP_DIR"

log "Mongo: запуск контейнера"
(cd "$APP_DIR" && docker compose up -d)

log "Зависимости и сборка клиента"
sudo -u "$WORKER_USER" bash -c "cd '$APP_DIR' && npm ci && npm run build"

log "Файл .env"
ENV_FILE="$APP_DIR/server/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$APP_DIR/server/.env.example" "$ENV_FILE"
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" "$ENV_FILE"
  sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)|" "$ENV_FILE"
  echo "Создан $ENV_FILE. Пароль для входа: $(grep ^ADMIN_PASSWORD "$ENV_FILE" | cut -d= -f2)"
  echo "Сохраните его сейчас, он больше не будет показан."
fi
chown "$WORKER_USER:$WORKER_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

log "systemd-сервис"
cp "$APP_DIR/deploy/mytracker-api.service" /etc/systemd/system/
sed -i "s|User=claude-worker|User=$WORKER_USER|" /etc/systemd/system/mytracker-api.service
systemctl daemon-reload
systemctl enable --now mytracker-api

log "nginx: сайт на порту 80 (без домена, по IP)"
sed -e 's|server_name tracker.example.com;|server_name _;|' "$APP_DIR/deploy/nginx.conf" \
  > /etc/nginx/sites-available/mytracker
ln -sf /etc/nginx/sites-available/mytracker /etc/nginx/sites-enabled/mytracker
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

log "Готово. Проверка:"
sleep 3
curl -fsS http://127.0.0.1:3001/api/health && echo " <- API отвечает"
curl -fsS http://127.0.0.1/api/health && echo " <- nginx проксирует API"
echo
echo "Дальше вручную:"
echo "  1. sudo -u $WORKER_USER -i, затем: claude   и /login (откройте ссылку на телефоне)"
echo "  2. Клонировать проекты в $REPOS_DIR/<project> (нужна ветка origin/main)"
echo "  3. Заполнить TELEGRAM_BOT_TOKEN и TELEGRAM_OWNER_ID в $ENV_FILE, затем: systemctl restart mytracker-api"
echo "  4. Открыть трекер: http://IP_СЕРВЕРА (для HTTPS: certbot --nginx -d ваш.домен)"
