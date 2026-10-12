# MyTracker

Личный таск-трекер (MERN). Задачи описываются в трекере и затем передаются Claude Code через skills.

## Структура

```
server/   Express + Mongoose: API, модель Task, вход по паролю
client/   React + Vite: вход и доска задач по статусам
.claude/  skills для Claude Code (implement-task, task-spec)
CLAUDE.md правила стека для Claude Code
```

## Запуск

Требуется Node 20+ и MongoDB.

```bash
npm install
cp server/.env.example server/.env   # заполните значения
npm run dev
```

- Клиент: http://localhost:5173
- API: http://localhost:3001/api

## Переменные окружения (server/.env)

| Имя | Назначение |
|---|---|
| `PORT` | порт API, по умолчанию 3001 |
| `MONGO_URL` | строка подключения к MongoDB |
| `ADMIN_PASSWORD` | пароль для входа |
| `JWT_SECRET` | секрет для подписи токенов |

## Тесты и линтер

```bash
npm test
npm run lint
```
