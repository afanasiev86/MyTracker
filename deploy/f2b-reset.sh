#!/usr/bin/env bash
# Снимает все блокировки fail2ban (команда бота /unban). Печатает число снятых адресов.
# Ставится в /usr/local/sbin/f2b-reset скриптом deploy/ops-setup.sh, sudo разрешён только на него и без аргументов.
set -euo pipefail

exec /usr/bin/fail2ban-client unban --all
