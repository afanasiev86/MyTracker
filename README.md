# MyTracker

Личный таск-трекер для MERN-проектов. Задачи описываются в трекере (веб-интерфейс или Telegram), затем Claude Code выполняет их в отдельной git-ветке, а вы проверяете diff и мержите сами.

## Структура

```
server/          Express + Mongoose: API, модель Task, воркер запуска, Telegram-бот
client/          React + Vite: доска, форма задачи, карточка с diff и комментариями
shared/          правила статусов, общие для сервера и клиента
.claude/skills/  implement-task (выполнить задачу) и task-spec (описать задачу)
CLAUDE.md        правила стека для Claude Code
deploy/          шаблоны systemd, nginx и скрипт бэкапа для VPS
```

## Статусы

`backlog → ready → in_progress → review → done`, из `in_progress` также `failed`.
Статус «В работе» задаётся только запуском. Запуск возможен из «Готово к работе», «На проверке» (доработка) и «Ошибка».

## Локальный запуск

Требуется Node 20+ и MongoDB (можно через Docker).

```bash
docker compose up -d        # MongoDB на 127.0.0.1:27017
npm install
cp server/.env.example server/.env   # заполните значения
npm run dev
```

- Клиент: http://localhost:5173
- API: http://localhost:3001/api

Для запуска задач нужны репозитории проектов в `REPOS_DIR/<project>` с `origin/main`, установленный Claude Code и вход выполнен (`claude`, затем `/login`).

## Telegram-бот

Заполните `TELEGRAM_BOT_TOKEN` (через @BotFather) и `TELEGRAM_OWNER_ID` (ваш числовой id). Команды:

- `/new <проект> <заголовок>`: создать задачу
- `/ready <id>`: перевести в «Готово к работе»
- `/run <id>`: запустить в Claude
- `/status`: активные задачи

Уведомления приходят при переходе задачи в «На проверке», «Ошибка» и при достижении лимита. Бот работает через long polling, поэтому webhook для этого бота задавать нельзя.

## Тесты и линтер

```bash
npm run lint
npm test                                  # без БД пропускаются тесты API
MONGO_URL_TEST=mongodb://127.0.0.1:27017/mytracker_test npm test   # полный набор
npm run build
```

В CI (`.github/workflows/ci.yml`) тесты запускаются с сервисом MongoDB.

## Развёртывание на VPS

1. Клонируйте трекер в `/srv/mytracker`, выполните `npm ci` и `npm run build`.
2. Скопируйте `server/.env.example` в `server/.env` и заполните значения. Файл доступен только владельцу: `chmod 600`.
3. Установите `deploy/mytracker-api.service` в systemd и включите его.
4. Настройте `deploy/nginx.conf` и HTTPS через certbot.
5. Добавьте `deploy/backup-mongo.sh` в cron.
6. Для push веток задач настройте deploy key с доступом на запись только к нужным репозиториям.

## Ограничения текущей версии

- Один пользователь, вход по паролю.
- Перетаскивание карточек между колонками не реализовано: статусы меняются кнопками.
- Лимит подписки распознаётся по тексту вывода Claude Code. Формат сообщения может измениться, и тогда список шаблонов в `server/src/worker/limits.js` нужно дополнить.
- Тесты API с БД запускаются в CI, локально они пропускаются без `MONGO_URL_TEST`.
