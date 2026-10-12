# Функции: Telegram-бот и Mini App

Начинай здесь для изменений в бот, уведомлениях, кнопках и дайджесте. Транспорт: telegram-transport (`docs/architecture/telegram-transport.md:L5#Транспорт`).

## Подключение из интерфейса
Вкладка «Настройки», карточка `client/src/components/TelegramSettings.jsx:L14-21#TelegramSettings`, запросы `client/src/api/telegram.js`. Маршрут `server/src/routes/telegram.js` (только владелец): `GET` отдаёт состояние без токена, `PUT` проверяет токен через `getMe`, сохраняет и применяет настройки, `DELETE` убирает значения интерфейса.
- Хранение: `server/src/services/telegram/runtime.js:L47-61#saveTelegramSettings`, коллекция настроек, ключ `telegram`. Токен шифруется AES-256-GCM с ключом из `JWT_SECRET` (`server/src/services/telegram/secretBox.js:L8-13#encryptSecret`). Если `JWT_SECRET` сменили, токен не расшифруется, сервер напишет об этом в лог, и его нужно ввести заново.
- Приоритет: значения из интерфейса важнее переменных окружения (`server/src/services/telegram/runtime.js:L9-16#getTelegramConfig`). Весь код читает настройки только через эту функцию, а не через `getConfig().telegram`.
- Применение без перезапуска: `server/src/services/telegram/connect.js:L25-41#connectTelegram`. Новый токен или включение бота перезапускают опрос (`server/src/bot/poller/botRunner.js:L11-15#restartBot`, старый цикл выходит по `isCurrent`), смена только ID или адреса Mini App обновляет кнопку меню. Планировщик дайджеста проверяет Telegram на каждом тике.
- После сохранения бот пишет владельцу. Если не смог (не нажат Start у бота или неверный ID), интерфейс показывает предупреждение, настройки при этом сохранены.

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
