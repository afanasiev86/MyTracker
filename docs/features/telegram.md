# Функции: Telegram-бот и Mini App

Начинай здесь для изменений в бот, уведомлениях, кнопках и дайджесте. Транспорт: telegram-transport (`docs/architecture/telegram-transport.md:L5#Транспорт`).

## Команды бота
Разбор и обработка: handleCommand (`docs/functions/server/bot/handleCommand.md:L13#Алгоритм`). Ответ на сообщение с ID работает как ответ на вопрос.

## Уведомления
Отправка: notify (`docs/functions/server/telegram/notify.md:L3#Назначение`) → sendTelegram (`docs/functions/server/telegram/sendTelegram.md:L3#Назначение`).

## Кнопки проверки
handleCallback (`docs/functions/server/bot/handleCallback.md:L13#Алгоритм`).

## Дайджест
buildDigest (`docs/functions/server/digest/buildDigest.md:L12#Алгоритм`), расписание startDigestScheduler (`docs/functions/server/digest/startDigestScheduler.md:L12#Алгоритм`).

## Mini App
Вход: verifyInitData (`docs/functions/server/telegram/verifyInitData.md:L12#Алгоритм`) и `server/src/routes/auth/telegramLogin.js:L8-31#telegramLogin`. Интерфейс: `client/src/App.jsx:L28-132#App`.
