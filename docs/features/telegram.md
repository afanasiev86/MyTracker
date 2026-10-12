# Функции: Telegram-бот и Mini App

Начинай здесь для изменений в бот, уведомлениях, кнопках и дайджесте. Транспорт: telegram-transport (`docs/architecture/telegram-transport.md:L5#Транспорт`).

## Подключение из интерфейса
Вкладка «Настройки», карточка `client/src/components/TelegramSettings.jsx:L14-21#TelegramSettings`, запросы `client/src/api/telegram.js`. Маршрут `server/src/routes/telegram.js` (только владелец): `GET` отдаёт состояние без токена, `PUT` проверяет токен через `getMe`, сохраняет и применяет настройки, `DELETE` убирает значения интерфейса.
- Хранение: `server/src/services/telegram/runtime.js:L47-61#saveTelegramSettings`, коллекция настроек, ключ `telegram`. Токен шифруется AES-256-GCM с ключом из `JWT_SECRET` (`server/src/services/telegram/secretBox.js:L8-13#encryptSecret`). Если `JWT_SECRET` сменили, токен не расшифруется, сервер напишет об этом в лог, и его нужно ввести заново.
- Приоритет: значения из интерфейса важнее переменных окружения (`server/src/services/telegram/runtime.js:L9-16#getTelegramConfig`). Весь код читает настройки только через эту функцию, а не через `getConfig().telegram`.
- Применение без перезапуска: `server/src/services/telegram/connect.js:L25-41#connectTelegram`. Новый токен или включение бота перезапускают опрос (`server/src/bot/poller/botRunner.js:L11-15#restartBot`, старый цикл выходит по `isCurrent`), смена только ID или адреса Mini App обновляет кнопку меню. Планировщик дайджеста проверяет Telegram на каждом тике.
- После сохранения бот пишет владельцу. Если не смог (не нажат Start у бота или неверный ID), интерфейс показывает предупреждение, настройки при этом сохранены.

## Управление сервером
Вкладка «Сервер» (`client/src/components/Server.jsx:L10-45#Server`) и команды бота: `/server` (ресурсы и сервисы), `/logs <сервис> [строк]`, `/service <restart|start|stop> <сервис>`, `/deploy`. Опасные действия бот сначала подтверждает кнопкой (`server/src/bot/opsCallbackData.js:L21-28#confirmKeyboard`), кнопка живёт 5 минут и срабатывает один раз.
- Только список: сервисы и допустимые действия заданы в `server/src/services/ops/catalog.js:L4-10#SERVICES`, произвольных команд нет. Команды запускаются без оболочки, аргументы списком: `server/src/services/ops/exec.js:L5-11#run`. Сам API можно только перезапустить, Docker только смотреть: остановка отсюда лишила бы управления.
- Метрики: `server/src/services/ops/metrics.js:L33-44#readMetrics` (память по `MemAvailable` из `/proc/meminfo`, диск раздела с трекером). Сервисы, журналы и обновление работают только на Linux (`server/src/services/ops/platform.js:L5-5#opsAvailable`), на другом ОС раздел показывает лишь ресурсы.
- Права: пользователь API не root. `deploy/ops-setup.sh` один раз даёт ему чтение журналов (группа `systemd-journal`) и `sudo` без пароля только на команды из списка в `/etc/sudoers.d/mytracker-ops`. Без этого действия отвечают «нет прав на sudo: выполните deploy/ops-setup.sh».
- Перезапуск самого API: `server/src/services/ops/control.js:L24-44#controlService` откладывает рестарт на секунду, чтобы ответ ушёл, и сохраняет сообщение в `.ops/notice.json`; после старта сервер отправляет его (`server/src/services/ops/notice.js:L17-25#reportPendingNotice`).
- Обновление: `server/src/services/ops/deploy.js:L71-88#startDeploy` запускает `deploy/update.sh` через `systemd-run`, чтобы перезапуск API не оборвал скрипт. Скрипт делает `git fetch` и `merge --ff-only`, `npm ci`, сборку, перезапуск и проверку, что API отвечает. При ошибке сборки или запуска возвращает прежнюю версию (`git reset --hard`). Итог пишется в `.ops/deploy-result.json`, владельцу его отправляет API (`server/src/services/ops/deploy.js:L46-52#reportDeployResult`): сразу, если API не перезапускался, или при старте.
- Оповещения: раз в минуту `server/src/services/ops/monitor.js:L33-49#startOpsMonitor` пишет владельцу, когда сервис остановился, диск или память заполнены на 90% и больше, и когда это исправилось. Сервисы, остановленные самим владельцем, поломкой не считаются.

## Команды бота
Разбор и обработка: handleCommand (`docs/functions/server/bot/handleCommand.md:L13#Алгоритм`). Ответ на сообщение с ID работает как ответ на вопрос.

## Уведомления
Отправка: notify (`docs/functions/server/telegram/notify.md:L3#Назначение`) → sendTelegram (`docs/functions/server/telegram/sendTelegram.md:L3#Назначение`).

## Кнопки проверки
handleCallback (`docs/functions/server/bot/handleCallback.md:L13#Алгоритм`).

## Дайджест
buildDigest (`docs/functions/server/digest/buildDigest.md:L12#Алгоритм`), расписание startDigestScheduler (`docs/functions/server/digest/startDigestScheduler.md:L12#Алгоритм`).

## Mini App
Вход: verifyInitData (`docs/functions/server/telegram/verifyInitData.md:L12#Алгоритм`) и `server/src/routes/auth/telegramLogin.js:L9-32#telegramLogin`. Интерфейс: `client/src/App.jsx:L12-95#App`.
