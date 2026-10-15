#!/bin/sh
# GIT_ASKPASS для GitHub по https: отдаёт git токен вместо запроса логина и пароля в терминале.
# Токен приходит в переменной MT_GIT_TOKEN, хост в MT_GIT_HOST (по умолчанию github.com).
# Для любого другого хоста ничего не отдаёт: токен не уходит на чужие адреса.
# Вызывается самим git, вручную запускать не нужно.
host="${MT_GIT_HOST:-github.com}"
case "$1" in
  *"$host"*) ;;
  *) exit 0 ;;
esac
case "$1" in
  Username*) printf '%s\n' "x-access-token" ;;
  Password*) printf '%s\n' "$MT_GIT_TOKEN" ;;
esac
